/**
 * Every word the pharmacy says, in one place.
 *
 * Verbatim from the brief — do not paraphrase. Wording lock: the meds are
 * taken or spat out. "take the meds / take them / took the meds / spit them
 * out / spit them into the trash". Never any other verb for it.
 *
 * The only lines not dictated by the brief are the four `trouble` lines at
 * the bottom (failure states the brief doesn't cover). Edit freely.
 */

export const COPY = {
  street: {
    door: ['AFTER HOURS RX', 'COUNTER 4444'],
    driveThru: 'WINDOW CLOSED. USE THE COUNTER.',
    insurance: 'WE DO NOT TAKE INSURANCE. WE DO NOT TAKE MEDS.',
    sugar: 'SUGAR SPILL. DO NOT LICK THE TILE.',
  },

  counter: {
    bell: 'RING FOR SERVICE',
    afterBell: 'the window is watching.',
    unopened: 'UNOPENED SCRIPT',
    vending: 'FOR THE MEDICATED. NOT YOU.',
  },

  pad: {
    identify: {
      button: 'SIGN IN WITH X',
      helper: 'THE WINDOW DOES NOT FILL WALK-INS WITHOUT A NAME.',
    },
    notes: {
      max: 250,
      placeholder: 'the window does not need a thesis. it needs a sentence.',
    },
    bag: {
      placeholder: 'solana wallet',
      note: 'THE COUNTER DOES NOT VERIFY THIS ONCHAIN FROM HERE.',
    },
    sideEffects: {
      follow: 'follow @Sweetardio',
      like: 'like the official notice',
      later: 'return to the bag later',
    },
    send: 'SEND TO FILL',
  },

  catch: {
    pad: ['TAKE YOUR MEDICATION', 'OR', 'SPIT IT OUT'],
    cup: 'TAKE THEM',
    can: 'SPIT THEM OUT',
  },

  pathA: 'you can go.',
  pathB: 'good.',

  bag: {
    status: ['CASE STATUS: REFUSED', 'COUNTER 4444 HAS YOUR FILE.', 'DO NOT RING AGAIN.'],
    pay: 'PAY AT WINDOW',
    minted: ['FILE CLOSED.', 'THE PHARMACY HAS NOTHING FURTHER TO DISPENSE.'],
    shut: 'THE WINDOW IS SHUT. SIT DOWN.',
  },

  mobile: {
    alt: 'THIS COUNTER BARELY WORKS ON PHONES. USE A DESKTOP.',
    enter: 'ENTER ANYWAY',
  },

  trouble: {
    signIn: 'the window did not catch your name. try again.',
    wallet: 'that is not a solana address.',
    payment: 'payment did not clear.',
    register: 'the register is jammed. try the window again later.',
  },
} as const;

/** The three intake questions, in order. Values are stored exactly as shown. */
export const QUESTIONS = [
  {
    id: 'medication',
    ask: 'Have you been taking your medication?',
    options: ['Yes', 'No', 'Define medication'],
  },
  {
    id: 'filled',
    ask: 'What do you want filled?',
    options: ['Candy', 'Answers', 'Both', 'Do not put that on the label'],
  },
  {
    id: 'allergies',
    ask: 'Allergies?',
    options: ['Sugar', 'Truth', 'Pharmacists', 'None I will list'],
  },
] as const;

export type QuestionId = (typeof QUESTIONS)[number]['id'];
