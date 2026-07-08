import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../../lib/GameEngine';
import { Overlay } from './Overlay';
import RainOverlay from './RainOverlay';
import { GameState } from '../../lib/types';
import { useGameWallet } from './WalletAdapter';
import { useJunkPusherOnChain } from '../../lib/useJunkPusherOnChain';
import { STARTING_CREDITS, getCredits, setCredits } from '../../lib/credits';
import { setupAutoSave, loadGameState, clearGameState } from '../../lib/statePersistence';
import { soundManager } from '../../lib/soundManager';
import { pushGameEvent } from '../../services/activityService';
import { subscribeToJunkPusherConfig } from '../../services/gameConfigService';
import { submitScore } from '../../services/leaderboardService';
import { resolvePlayer, currentPlayerId } from '../../lib/playerIdentity';

type MascotPhase = 'hidden' | 'rising' | 'visible' | 'falling';

const JunkPusherGame: React.FC = () => {
    const gameCanvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const wallet = useGameWallet();

    // On-chain integration hook
    const onChain = useJunkPusherOnChain();

    const [isRaining, setIsRaining] = useState(false);
    const [adminPaused, setAdminPaused] = useState(false);

    // Mascot random event state
    const [mascotPhase, setMascotPhase] = useState<MascotPhase>('hidden');
    const mascotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mascotActiveRef = useRef(false);

    // Mascot animation sequence — uses a ref to avoid circular useCallback deps
    const runMascotSequence = useRef<() => void>(null as any);
    runMascotSequence.current = () => {
        if (mascotActiveRef.current) return;
        mascotActiveRef.current = true;
        setMascotPhase('rising');

        // Drop a random bonus rain of 25–150 coins spread over ~4 seconds
        const bonusCount = 25 + Math.floor(Math.random() * 126);
        const dropInterval = 4000 / bonusCount;
        let dropped = 0;
        const coinRainInterval = setInterval(() => {
            if (dropped >= bonusCount || !engineRef.current) {
                clearInterval(coinRainInterval);
                return;
            }
            engineRef.current.dropBonusCoin();
            dropped++;
        }, dropInterval);

        // After rise animation (3s), hold visible for 20s
        mascotTimerRef.current = setTimeout(() => {
            setMascotPhase('visible');

            mascotTimerRef.current = setTimeout(() => {
                setMascotPhase('falling');

                // After fall (3s), reset and schedule next random event
                mascotTimerRef.current = setTimeout(() => {
                    setMascotPhase('hidden');
                    mascotActiveRef.current = false;
                    // Schedule next rare occurrence: 5–12 minutes from now
                    const delay = 300000 + Math.random() * 420000;
                    mascotTimerRef.current = setTimeout(() => runMascotSequence.current(), delay);
                }, 3000);
            }, 20000);
        }, 3000);
    };

    useEffect(() => {
        // Rare event: first trigger between 5–12 minutes
        const initialDelay = 300000 + Math.random() * 420000;
        mascotTimerRef.current = setTimeout(() => runMascotSequence.current(), initialDelay);
        return () => {
            if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
        };
    }, []);

    const [gameState, setGameState] = useState<GameState>({
        score: 0,
        balance: STARTING_CREDITS, // shared credit stack — restored per player below
        netProfit: 0,
        fps: 0,
        isPaused: false,
    });
    const gameStateRef = useRef(gameState);
    gameStateRef.current = gameState;

    const walletKeyRef = useRef(wallet.publicKey);
    walletKeyRef.current = wallet.publicKey;

    // Stable refs for on-chain methods to avoid re-render cascades
    const onChainRef = useRef(onChain);
    onChainRef.current = onChain;

    // Guard against double-click on deposit/withdraw
    const txInFlightRef = useRef(false);
    const lastScoreMilestoneRef = useRef(0);
    const lastSyncScoreRef = useRef(0);
    const handleUpdate = useCallback((partialState: Partial<GameState>) => {
        setGameState(prev => {
            const next = { ...prev, ...partialState };
            // Emit a WIN event every 10 coins collected
            if (next.score > 0 && Math.floor(next.score / 10) > lastScoreMilestoneRef.current) {
                lastScoreMilestoneRef.current = Math.floor(next.score / 10);
                pushGameEvent('WIN', `Player hit ${next.score} coins on Coinpusher (+${next.netProfit > 0 ? next.netProfit : 0} SWEET)`);
                // Post standing to the leaderboard (fire-and-forget). Works in
                // free play (anonymous handle) and when a wallet is connected.
                const { player, name } = resolvePlayer(walletKeyRef.current);
                submitScore('coinpusher', {
                    player,
                    name,
                    score: next.score,
                    balance: next.balance,
                    netProfit: next.netProfit,
                });
            }
            // Periodic on-chain balance sync every 50 coins
            if (next.score > 0 && Math.floor(next.score / 50) > lastSyncScoreRef.current) {
                lastSyncScoreRef.current = Math.floor(next.score / 50);
                const oc = onChainRef.current;
                if (oc.isProgramReady && wallet.isConnected) {
                    oc.syncBalance(next.balance).catch((err: any) =>
                        console.warn('[JunkPusher] Periodic sync failed:', err)
                    );
                }
            }
            return next;
        });
    }, [wallet.isConnected]);

    // Silently restore saved state so a refresh (or crash) never eats coins.
    // Balance comes from the shared arcade credits stack (per player identity —
    // wallet address or anon id); score / net profit from the local game save.
    const recoveredRef = useRef<{ balance: number; score: number; netProfit: number } | null>(null);
    useEffect(() => {
        const playerId = currentPlayerId(wallet.publicKey);
        let cancelled = false;

        const restore = async () => {
            const credits = await getCredits(playerId); // mints STARTING_CREDITS on first play
            if (cancelled) return;
            const local = loadGameState(playerId) ?? loadGameState(wallet.publicKey);
            const recovered = {
                balance: credits,
                score: local?.score ?? 0,
                netProfit: local?.netProfit ?? 0,
            };
            recoveredRef.current = recovered;
            setGameState(prev => ({ ...prev, ...recovered }));
            engineRef.current?.restoreState(recovered.balance, recovered.score, recovered.netProfit);
        };

        restore();
        return () => {
            cancelled = true;
        };
    }, [wallet.publicKey]);

    // Initialize sound manager on first user interaction with the game
    useEffect(() => {
        const initSound = () => {
            soundManager.initialize();
            window.removeEventListener('pointerdown', initSound);
        };
        window.addEventListener('pointerdown', initSound);
        return () => window.removeEventListener('pointerdown', initSound);
    }, []);

    // Setup auto-save (uses refs to avoid re-registering on every state change).
    // Persists score/netProfit to the game save and the balance to the shared
    // credits stack, keyed by the player identity (wallet or anon id).
    useEffect(() => {
        const cleanup = setupAutoSave(
            () => gameStateRef.current,
            () => currentPlayerId(walletKeyRef.current)
        );
        const creditsInterval = setInterval(() => {
            setCredits(currentPlayerId(walletKeyRef.current), gameStateRef.current.balance);
        }, 5000);
        return () => {
            cleanup();
            clearInterval(creditsInterval);
            // Final flush so leaving the page mid-run keeps your stack current
            setCredits(currentPlayerId(walletKeyRef.current), gameStateRef.current.balance);
        };
    }, []);

    useEffect(() => {
        if (!gameCanvasRef.current) return;

        const canvas = gameCanvasRef.current;
        
        // Use a more robust way to get dimensions that accounts for the parent container
        const updateDimensions = () => {
            const parent = canvas.parentElement;
            const width = parent ? parent.clientWidth : window.innerWidth;
            const height = parent ? parent.clientHeight : window.innerHeight;
            
            canvas.width = width;
            canvas.height = height;
            return { width, height };
        };

        const { width, height } = updateDimensions();

        if (width === 0 || height === 0) return;

        let disposed = false;
        const engine = new GameEngine({
            debugControls: true,
            debugFps: true
        });

        engine.initialize(canvas, handleUpdate).then(() => {
            if (!disposed) {
                engineRef.current = engine;
                // Restore saved state into the engine if we recovered before init
                if (recoveredRef.current) {
                    const r = recoveredRef.current;
                    engine.restoreState(r.balance, r.score, r.netProfit);
                }
                // Wire up rain events
                engine.setRainCallback(setIsRaining);
                // Force a resize after init to ensure correct aspect ratio
                const dims = updateDimensions();
                engine.resize(dims.width, dims.height);
            } else {
                engine.cleanup();
            }
        }).catch((err) => {
            console.error('GameEngine init failed:', err);
        });

        const handleResize = () => {
            if (engineRef.current) {
                const dims = updateDimensions();
                engineRef.current.resize(dims.width, dims.height);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            disposed = true;
            window.removeEventListener('resize', handleResize);
            engineRef.current = null;
            engine.cleanup();
        };
    }, [handleUpdate]);

    // Subscribe to admin pause flag
    useEffect(() => {
        const unsub = subscribeToJunkPusherConfig((cfg) => setAdminPaused(cfg.paused));
        return unsub;
    }, []);

    const handleDropCoin = () => {
        soundManager.initialize();
        if (engineRef.current && !gameState.isPaused && !adminPaused) {
            const x = (Math.random() - 0.5) * 6;
            engineRef.current.dropUserCoin(x);
        }
    };

    /**
     * FEAT-01: Bump now attempts a real on-chain transaction when:
     *  - The on-chain program is deployed (isProgramReady)
     *  - The wallet is connected
     * Falls back to the local mock flow if the program isn't deployed yet.
     */
    const handleBump = useCallback(async () => {
        if (engineRef.current && !gameStateRef.current.isPaused && !adminPaused) {
            const oc = onChainRef.current;
            if (oc.isProgramReady && wallet.isConnected) {
                try {
                    await oc.recordCoinCollection(gameStateRef.current.score);
                } catch (err) {
                    console.warn('[JunkPusher] On-chain bump failed, continuing locally:', err);
                }
            }
            engineRef.current.bump();
            soundManager.play('bump');
        }
    }, [wallet.isConnected]);

    const handleReset = useCallback(async () => {
        if (engineRef.current) {
            const oc = onChainRef.current;
            const currentState = gameStateRef.current;
            if (oc.isProgramReady && wallet.isConnected && currentState.score > 0) {
                try {
                    await oc.recordScore(currentState.score);
                } catch (err) {
                    console.warn('[JunkPusher] Failed to record score on-chain:', err);
                }
            }

            engineRef.current.reset();
            setGameState({
                score: 0,
                balance: STARTING_CREDITS, // fresh run, fresh starting stack
                netProfit: 0,
                fps: currentState.fps,
                isPaused: false,
            });
            clearGameState();
            setCredits(currentPlayerId(walletKeyRef.current), STARTING_CREDITS);
        }
    }, [wallet.isConnected]);

    const handleDeposit = useCallback(async (amount: number): Promise<string | null> => {
        if (txInFlightRef.current) return null; // double-click guard
        const oc = onChainRef.current;
        if (oc.isProgramReady && wallet.isConnected) {
            txInFlightRef.current = true;
            try {
                const sig = await oc.depositBalance(amount);
                if (sig) {
                    // Credit the engine's internal balance so it stays in sync
                    engineRef.current?.addBalance(amount);
                    pushGameEvent('DEPOSIT', `Player deposited ${amount} SWEET into Coinpusher`);
                }
                return sig;
            } catch (err) {
                console.error('[JunkPusher] Deposit failed:', err);
                return null;
            } finally {
                txInFlightRef.current = false;
            }
        }
        return null;
    }, [wallet.isConnected]);

    const MAX_WITHDRAW = 250_000;
    const handleWithdraw = useCallback(async (amount: number): Promise<string | null> => {
        if (txInFlightRef.current) return null; // double-click guard
        const oc = onChainRef.current;
        const currentBalance = gameStateRef.current.balance;
        if (!oc.isProgramReady || !wallet.isConnected) return null;
        if (amount <= 0 || amount > currentBalance || amount > MAX_WITHDRAW) return null;

        txInFlightRef.current = true;
        try {
            const intAmount = Math.floor(amount);
            const sig = await oc.syncAndWithdraw(intAmount, currentBalance);
            if (sig) {
                // Deduct from engine balance
                if (engineRef.current) {
                    engineRef.current.addBalance(-intAmount);
                } else {
                    setGameState(prev => ({ ...prev, balance: prev.balance - intAmount }));
                }
                pushGameEvent('WIN', `Player withdrew ${intAmount} SWEET from Coinpusher`);
            }
            return sig;
        } catch (err) {
            console.error('[JunkPusher] Withdraw failed:', err);
            return null;
        } finally {
            txInFlightRef.current = false;
        }
    }, [wallet.isConnected]);

    /** Off-chain refill: top the shared stack back up to STARTING_CREDITS, free. */
    const handleRefill = useCallback(() => {
        const delta = STARTING_CREDITS - gameStateRef.current.balance;
        if (delta <= 0) return;
        if (engineRef.current) {
            engineRef.current.addBalance(delta);
        } else {
            setGameState(prev => ({ ...prev, balance: prev.balance + delta }));
        }
        setCredits(currentPlayerId(walletKeyRef.current), STARTING_CREDITS);
        pushGameEvent('DEPOSIT', 'Player refilled their SWEET credit stack');
    }, []);

    const handlePauseToggle = () => {
        if (engineRef.current) {
            engineRef.current.togglePause();
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        soundManager.initialize();
        if (!engineRef.current || gameState.isPaused || adminPaused) return;
        const canvas = gameCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        engineRef.current.dropCoinAtRaycast(ndcX, ndcY);
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* Background Image */}
            <img
                src="/games-bg.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ objectPosition: 'center' }}
            />

            {/* Rain overlay — renders over background, behind game */}
            <RainOverlay active={isRaining} />

            {/* Mascot random event — Choppa Cone rises from below behind the 3D canvas */}
            <img
                src="/mascot.png"
                alt=""
                className="absolute left-1/2 pointer-events-none select-none"
                style={{
                    bottom: '44%',
                    width: '72%',
                    maxWidth: '860px',
                    transform: `translateX(-50%) translateY(${
                        mascotPhase === 'hidden' || mascotPhase === 'falling' ? '110%' : '0%'
                    })`,
                    transition: mascotPhase === 'falling'
                        ? 'transform 3s cubic-bezier(0.64, 0, 0.78, 0)'
                        : 'transform 3s cubic-bezier(0.22, 0.61, 0.36, 1)',
                    zIndex: 1,
                }}
            />

            {/* On-chain status indicator */}
            {wallet.isConnected && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                    {onChain.isProgramReady ? (
                        <div className="flex items-center gap-1.5 bg-black/80 border border-[#cbf30c]/20 px-2.5 py-1 rounded-full text-[9px] backdrop-blur-sm">
                            <img src="/assets/logo-circle-transparent.png" alt="" className="w-3.5 h-3.5" />
                            <span className="text-[#cbf30c]/70 font-bold tracking-widest uppercase">On-Chain</span>
                            {onChain.debrisBalance > 0 && (
                                <span className="text-white/50 ml-0.5">{onChain.debrisBalance.toFixed(0)} SWEET</span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-black/80 border border-yellow-500/20 px-2.5 py-1 rounded-full text-[9px] backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            <span className="text-yellow-300/70 font-bold tracking-widest uppercase">Local Mode</span>
                        </div>
                    )}
                </div>
            )}

            {/* Transaction status toast */}
            {onChain.txStatus !== 'idle' && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-[340px] max-w-[90vw]">
                    <div className={`relative overflow-hidden rounded-lg shadow-2xl ${
                        onChain.txStatus === 'error'
                            ? 'bg-gradient-to-b from-red-950/95 to-black/95 border border-red-500/40'
                            : onChain.txStatus === 'confirmed'
                            ? 'bg-gradient-to-b from-green-950/95 to-black/95 border border-green-500/40'
                            : 'bg-gradient-to-b from-[#1a1a0a]/95 to-black/95 border border-[#cbf30c]/30'
                    }`}>
                        {/* Progress bar */}
                        <div className="absolute top-0 left-0 h-[2px] bg-[#cbf30c]/60" style={{
                            width: onChain.txStatus === 'building' ? '25%'
                                : onChain.txStatus === 'signing' ? '50%'
                                : onChain.txStatus === 'confirming' ? '75%'
                                : '100%',
                            transition: 'width 0.4s ease-out',
                            ...(onChain.txStatus === 'error' ? { background: 'rgb(239 68 68 / 0.6)' } : {}),
                        }} />

                        <div className="flex items-center gap-3 px-4 py-3">
                            {/* Logo */}
                            <img
                                src="/assets/logo-circle-transparent.png"
                                alt="TM"
                                className={`w-8 h-8 shrink-0 ${
                                    onChain.txStatus === 'confirming' || onChain.txStatus === 'building'
                                        ? 'animate-pulse' : ''
                                }`}
                            />

                            {/* Content */}
                            <div className="flex flex-col min-w-0">
                                {/* Header row: brand + label */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#cbf30c]/80">trashmarket.fun</span>
                                    {onChain.txLabel && (
                                        <>
                                            <span className="text-[#cbf30c]/30 text-[10px]">/</span>
                                            <span className="text-[10px] font-medium tracking-wide uppercase text-white/60">{onChain.txLabel}</span>
                                        </>
                                    )}
                                </div>

                                {/* Status message */}
                                <span className={`text-xs font-medium mt-0.5 ${
                                    onChain.txStatus === 'error' ? 'text-red-300' :
                                    onChain.txStatus === 'confirmed' ? 'text-green-300' :
                                    'text-white/80'
                                }`}>
                                    {onChain.txStatus === 'building' && 'Preparing transaction...'}
                                    {onChain.txStatus === 'signing' && 'Approve in your wallet'}
                                    {onChain.txStatus === 'confirming' && 'Confirming on Gorbagana...'}
                                    {onChain.txStatus === 'confirmed' && 'Transaction confirmed'}
                                    {onChain.txStatus === 'error' && (onChain.error || 'Transaction failed')}
                                </span>
                            </div>

                            {/* Status icon */}
                            <div className="ml-auto shrink-0">
                                {(onChain.txStatus === 'building' || onChain.txStatus === 'signing' || onChain.txStatus === 'confirming') && (
                                    <svg className="animate-spin h-4 w-4 text-[#cbf30c]/60" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                                {onChain.txStatus === 'confirmed' && (
                                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {onChain.txStatus === 'error' && (
                                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <canvas
                ref={gameCanvasRef}
                onClick={handleCanvasClick}
                className="absolute inset-0 w-full h-full"
                style={{ cursor: 'crosshair', zIndex: 2 }}
            />

            {/* Mascot event: dim overlay with spotlight cutout over the pusher surface */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    zIndex: 3,
                    background: 'radial-gradient(ellipse 52% 65% at 50% 54%, transparent 0%, rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.85) 72%)',
                    opacity: mascotPhase === 'hidden' ? 0 : mascotPhase === 'falling' ? 0 : 1,
                    transition: mascotPhase === 'rising'
                        ? 'opacity 2s ease-in'
                        : mascotPhase === 'falling'
                        ? 'opacity 2s ease-out'
                        : 'none',
                }}
            />
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                <Overlay
                    gameState={gameState}
                    onDropCoin={handleDropCoin}
                    onBump={handleBump}
                    onReset={handleReset}
                    onDeposit={handleDeposit}
                    onWithdraw={handleWithdraw}
                    onRefill={handleRefill}
                    onPauseToggle={handlePauseToggle}
                    wallet={wallet}
                    onChainReady={onChain.isProgramReady}
                />
            </div>
            {adminPaused && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                    <div className="border border-amber-500/60 bg-black/80 px-8 py-4 text-center">
                        <p className="text-amber-400 font-black text-lg uppercase tracking-widest">Game Paused</p>
                        <p className="text-gray-500 text-xs font-mono mt-1">Temporarily unavailable — check back soon</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JunkPusherGame;
