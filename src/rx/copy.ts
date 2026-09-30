/**
 * Every word the pharmacy says, in one place.
 *
 * Verbatim from the brief — do not paraphrase. Wording lock: the meds are
 * taken or spat out. "take the meds / take them / took the meds / spit them
 * out / spit them into the trash". Never any other verb for it.
 *
 * Not dictated by the brief (edit freely): the `trouble` lines at the bottom
 * (failure states the brief doesn't cover), the Google / email sign-in
 * words, added after the brief asked for X only, and the phone sheet's box
 * titles (printed on the pad) and DONE, and the counter's `refused` lines
 * (the hidden back-room links).
 *
 * Mint locked (dictated): whoever cannot pay gets FILLED, FILE CLOSED or
 * THE WINDOW IS SHUT, never a wallet or contract error.
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
    /** Only there once the pills are in the trash. */
    refused: {
      telegram: 'B4 — FOR THE REFUSED. TELEGRAM.',
      keypad: 'VENDING KEYPAD',
      sign: 'REFUSED WELCOME. THE BACK ROOM IS ON DISCORD.',
    },
  },

  pad: {
    identify: {
      lead: 'SIGN IN WITH',
      x: 'X',
      google: 'GOOGLE',
      email: 'EMAIL',
      helper: 'THE WINDOW DOES NOT FILL WALK-INS WITHOUT A NAME.',
    },
    emailSlip: {
      email: 'email',
      password: 'password (6 or more)',
      signIn: 'SIGN IN',
      create: 'NEW PATIENT',
      forgot: 'forgot it',
      sent: 'check your email for the reset link.',
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
    /** The printed box titles, as the phone sheet's headings. */
    boxes: {
      identify: 'IDENTIFY YOURSELF',
      notes: 'PHARMACIST NOTES',
      bag: 'WHERE WE SEND THE BAG',
      side: 'SIDE EFFECTS',
    },
    done: 'DONE',
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
    /** Phase closed, sold out, paused by us, or not this domain. */
    shut: ['THE WINDOW IS SHUT. SIT DOWN.', 'DO NOT CALL THE PHARMACY.'],
  },

  /** No wallet can reach this browser (X and other in-app browsers). */
  inApp: ['THE WINDOW DOES NOT LIKE IN-APP BROWSERS.', 'OPEN IN PHANTOM OR SAFARI.'],

  mobile: {
    alt: 'THIS COUNTER BARELY WORKS ON PHONES. USE A DESKTOP.',
    enter: 'ENTER ANYWAY',
  },

  trouble: {
    signIn: 'the window did not catch your name. try again.',
    closed: 'the window is not taking that kind of name yet.',
    emailWrong: 'that email and password do not open a file.',
    emailTaken: 'that email already has a file. sign in.',
    emailWeak: 'the password needs 6 characters or more.',
    emailBad: 'that is not an email.',
    tooMany: 'too many tries. wait a minute.',
    popup: 'that window will not open here. use EMAIL.',
    wallet: 'that is not a solana address.',
    payment: 'payment did not clear.',
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
