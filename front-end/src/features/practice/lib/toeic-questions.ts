export type ToeicQuestion = {
  id: string;
  partId: string;
  questionNumber: number;
  passage?: string;
  passageGroupId?: string;
  stem: string;
  options: { label: string; text: string }[];
  correctAnswer?: string;
  image_url?: string | null;
  audio_url?: string | null;
  explanation?: string | null;
  transcript?: string | null;
};

// ---------------------------------------------------------------------------
// Part 1 — Photographs (Q1-6)
// ---------------------------------------------------------------------------

const part1Questions: ToeicQuestion[] = [
  {
    id: "lr-2022-1-q1",
    partId: "part-1",
    questionNumber: 1,
    stem: "Look at the photograph. Which statement best describes what you see?",
    options: [
      { label: "A", text: "A man is placing documents into a filing cabinet." },
      { label: "B", text: "A woman is typing on a laptop at her desk." },
      { label: "C", text: "Two people are shaking hands in a conference room." },
      { label: "D", text: "A group of workers is loading boxes onto a truck." }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q2",
    partId: "part-1",
    questionNumber: 2,
    stem: "Look at the photograph. Which statement best describes what you see?",
    options: [
      { label: "A", text: "The shelves are fully stocked with merchandise." },
      { label: "B", text: "A customer is paying at the checkout counter." },
      { label: "C", text: "An employee is sweeping the floor of the store." },
      { label: "D", text: "The store entrance is being repainted." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q3",
    partId: "part-1",
    questionNumber: 3,
    stem: "Look at the photograph. Which statement best describes what you see?",
    options: [
      { label: "A", text: "A woman is watering plants in a garden." },
      { label: "B", text: "A chef is preparing food in a kitchen." },
      { label: "C", text: "A technician is repairing a piece of equipment." },
      { label: "D", text: "A presenter is pointing at a screen during a meeting." }
    ],
    correctAnswer: "D"
  },
  {
    id: "lr-2022-1-q4",
    partId: "part-1",
    questionNumber: 4,
    stem: "Look at the photograph. Which statement best describes what you see?",
    options: [
      { label: "A", text: "Passengers are boarding an airplane." },
      { label: "B", text: "Vehicles are parked along the curb." },
      { label: "C", text: "A train is arriving at a platform." },
      { label: "D", text: "Workers are constructing a bridge." }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q5",
    partId: "part-1",
    questionNumber: 5,
    stem: "Look at the photograph. Which statement best describes what you see?",
    options: [
      { label: "A", text: "A receptionist is answering the telephone." },
      { label: "B", text: "Office chairs are arranged around a table." },
      { label: "C", text: "A man is hanging a painting on the wall." },
      { label: "D", text: "Papers are scattered across the floor." }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q6",
    partId: "part-1",
    questionNumber: 6,
    stem: "Look at the photograph. Which statement best describes what you see?",
    options: [
      { label: "A", text: "Diners are seated at tables in a restaurant." },
      { label: "B", text: "A waiter is clearing dishes from a table." },
      { label: "C", text: "A woman is reading a menu at the counter." },
      { label: "D", text: "The restaurant kitchen is empty." }
    ],
    correctAnswer: "A"
  }
];

// ---------------------------------------------------------------------------
// Part 2 — Question-Response (Q7-31)
// ---------------------------------------------------------------------------

const part2Questions: ToeicQuestion[] = [
  {
    id: "lr-2022-1-q7",
    partId: "part-2",
    questionNumber: 7,
    stem: "When is the board meeting scheduled for?",
    options: [
      { label: "A", text: "It's on Thursday at ten o'clock." },
      { label: "B", text: "Yes, I attended the meeting." },
      { label: "C", text: "In the main conference room." },
      { label: "D", text: "The board was replaced last week." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q8",
    partId: "part-2",
    questionNumber: 8,
    stem: "Who is responsible for ordering office supplies?",
    options: [
      { label: "A", text: "About thirty boxes." },
      { label: "B", text: "Ms. Tanaka handles that." },
      { label: "C", text: "The supplies arrived yesterday." },
      { label: "D", text: "I prefer the blue folders." }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q9",
    partId: "part-2",
    questionNumber: 9,
    stem: "Where can I find the quarterly sales report?",
    options: [
      { label: "A", text: "It's in the shared drive under Finance." },
      { label: "B", text: "Sales have been strong this quarter." },
      { label: "C", text: "I reported it to the manager." },
      { label: "D", text: "Quarterly means every three months." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q10",
    partId: "part-2",
    questionNumber: 10,
    stem: "Hasn't the new software been installed yet?",
    options: [
      { label: "A", text: "No, the IT team is still working on it." },
      { label: "B", text: "I like the old software better." },
      { label: "C", text: "The hardware is quite expensive." },
      { label: "D", text: "Yes, I have installed shelves before." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q11",
    partId: "part-2",
    questionNumber: 11,
    stem: "How long will the maintenance work take?",
    options: [
      { label: "A", text: "It should be finished by Friday." },
      { label: "B", text: "The building is on Park Avenue." },
      { label: "C", text: "Yes, it takes a long time." },
      { label: "D", text: "The mechanic has a long commute." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q12",
    partId: "part-2",
    questionNumber: 12,
    stem: "Would you prefer to meet in person or over video call?",
    options: [
      { label: "A", text: "Either way is fine with me." },
      { label: "B", text: "I met her at the conference." },
      { label: "C", text: "The video was very informative." },
      { label: "D", text: "I called three times yesterday." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q13",
    partId: "part-2",
    questionNumber: 13,
    stem: "Why was the product launch postponed?",
    options: [
      { label: "A", text: "It launched at the convention center." },
      { label: "B", text: "Because the packaging wasn't ready." },
      { label: "C", text: "The product is available in three colors." },
      { label: "D", text: "We posted it on the website." }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q14",
    partId: "part-2",
    questionNumber: 14,
    stem: "Could you review this contract before the end of the day?",
    options: [
      { label: "A", text: "Sure, I'll take a look after lunch." },
      { label: "B", text: "The contract is three pages long." },
      { label: "C", text: "I reviewed the restaurant on the app." },
      { label: "D", text: "Yes, the day ended early." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q15",
    partId: "part-2",
    questionNumber: 15,
    stem: "Didn't the client confirm the delivery date?",
    options: [
      { label: "A", text: "Not yet — we're waiting for a response." },
      { label: "B", text: "The date was January fifteenth." },
      { label: "C", text: "I delivered the package myself." },
      { label: "D", text: "The client is very experienced." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q16",
    partId: "part-2",
    questionNumber: 16,
    stem: "What time does the workshop begin?",
    options: [
      { label: "A", text: "Registration starts at eight thirty." },
      { label: "B", text: "It's a very productive workshop." },
      { label: "C", text: "I work in the shop downstairs." },
      { label: "D", text: "Yes, the time has changed." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q17",
    partId: "part-2",
    questionNumber: 17,
    stem: "Have the budget projections been approved?",
    options: [
      { label: "A", text: "Yes, the director signed off this morning." },
      { label: "B", text: "The projector is in the meeting room." },
      { label: "C", text: "We need to budget more carefully." },
      { label: "D", text: "The approval process is complex." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q18",
    partId: "part-2",
    questionNumber: 18,
    stem: "Should we order lunch for the training session?",
    options: [
      { label: "A", text: "That would be a good idea." },
      { label: "B", text: "I trained for three months." },
      { label: "C", text: "Lunch is usually at noon." },
      { label: "D", text: "The order was placed online." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q19",
    partId: "part-2",
    questionNumber: 19,
    stem: "Where should I submit the expense report?",
    options: [
      { label: "A", text: "Through the online reimbursement portal." },
      { label: "B", text: "The expenses were quite high." },
      { label: "C", text: "I submitted my resignation." },
      { label: "D", text: "The reporter covered the story." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q20",
    partId: "part-2",
    questionNumber: 20,
    stem: "Who should I contact about the warranty claim?",
    options: [
      { label: "A", text: "Try the customer service department." },
      { label: "B", text: "The warranty lasts for two years." },
      { label: "C", text: "I claimed the parking space." },
      { label: "D", text: "We contacted them last Tuesday." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q21",
    partId: "part-2",
    questionNumber: 21,
    stem: "How often do you travel for business?",
    options: [
      { label: "A", text: "Usually about twice a month." },
      { label: "B", text: "The travel agency is on Main Street." },
      { label: "C", text: "I'm not busy right now." },
      { label: "D", text: "Yes, I travel by train." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q22",
    partId: "part-2",
    questionNumber: 22,
    stem: "The new employee orientation is tomorrow, isn't it?",
    options: [
      { label: "A", text: "Actually, it's been moved to Wednesday." },
      { label: "B", text: "The employee was very skilled." },
      { label: "C", text: "I'm oriented to the north side." },
      { label: "D", text: "Yes, I was a new employee once." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q23",
    partId: "part-2",
    questionNumber: 23,
    stem: "Do you know if the warehouse has been inspected?",
    options: [
      { label: "A", text: "Yes, it passed the inspection last week." },
      { label: "B", text: "The warehouse is very large." },
      { label: "C", text: "I inspected the merchandise carefully." },
      { label: "D", text: "No, I don't know where it is." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q24",
    partId: "part-2",
    questionNumber: 24,
    stem: "Would you mind closing the window?",
    options: [
      { label: "A", text: "Not at all — it is getting cold." },
      { label: "B", text: "The window faces the parking lot." },
      { label: "C", text: "I mind the store on weekends." },
      { label: "D", text: "The curtains are already closed." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q25",
    partId: "part-2",
    questionNumber: 25,
    stem: "Which floor is the Human Resources office on?",
    options: [
      { label: "A", text: "It's on the fourth floor, next to the elevator." },
      { label: "B", text: "The office is open from nine to five." },
      { label: "C", text: "Human resources are important for any company." },
      { label: "D", text: "I floored it on the highway." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q26",
    partId: "part-2",
    questionNumber: 26,
    stem: "Can I borrow your access badge for a moment?",
    options: [
      { label: "A", text: "Sorry, I need it to get back in." },
      { label: "B", text: "The badge was designed by our team." },
      { label: "C", text: "I accessed the file yesterday." },
      { label: "D", text: "Yes, you can borrow my book." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q27",
    partId: "part-2",
    questionNumber: 27,
    stem: "What did the manager say about the overtime policy?",
    options: [
      { label: "A", text: "She said it would be reviewed next month." },
      { label: "B", text: "The manager is on vacation." },
      { label: "C", text: "I always work overtime on Fridays." },
      { label: "D", text: "The policy manual is on the shelf." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q28",
    partId: "part-2",
    questionNumber: 28,
    stem: "Have you finished proofreading the annual report?",
    options: [
      { label: "A", text: "Almost — just a few more pages." },
      { label: "B", text: "The report was very detailed." },
      { label: "C", text: "I read the newspaper every morning." },
      { label: "D", text: "Yes, annually means once a year." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q29",
    partId: "part-2",
    questionNumber: 29,
    stem: "Why don't we reschedule the meeting to next week?",
    options: [
      { label: "A", text: "That works — Monday afternoon is best for me." },
      { label: "B", text: "The meeting lasted two hours." },
      { label: "C", text: "I met him at the conference." },
      { label: "D", text: "Next week is after this week." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q30",
    partId: "part-2",
    questionNumber: 30,
    stem: "Is there a shuttle bus to the airport from the hotel?",
    options: [
      { label: "A", text: "Yes, it runs every thirty minutes." },
      { label: "B", text: "The hotel has a swimming pool." },
      { label: "C", text: "My flight arrives at noon." },
      { label: "D", text: "I took a bus to school." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q31",
    partId: "part-2",
    questionNumber: 31,
    stem: "Who will be leading the presentation to the investors?",
    options: [
      { label: "A", text: "Mr. Chen from the strategy team." },
      { label: "B", text: "The presentation was well received." },
      { label: "C", text: "We invested in new equipment." },
      { label: "D", text: "The leader was very experienced." }
    ],
    correctAnswer: "A"
  }
];

// ---------------------------------------------------------------------------
// Part 3 — Conversations (Q32-70) — 13 groups × 3 questions
// ---------------------------------------------------------------------------

const part3Questions: ToeicQuestion[] = [
  // Group 1 (Q32-34) — Office relocation
  {
    id: "lr-2022-1-q32",
    partId: "part-3",
    questionNumber: 32,
    passageGroupId: "part3-group-1",
    passage: "W: Have you heard? The company is moving our department to the new building on Harbor Road next month.\nM: Really? That's quite far from here. Will the shuttle service still be available?\nW: Yes, they said the shuttle will run every fifteen minutes during rush hour. And the new office has much better facilities — a gym and a cafeteria on the ground floor.\nM: That sounds great. I just hope the commute won't be too long.",
    stem: "What are the speakers mainly discussing?",
    options: [
      { label: "A", text: "A change in office location" },
      { label: "B", text: "A new company shuttle schedule" },
      { label: "C", text: "Plans for building renovation" },
      { label: "D", text: "A new employee orientation" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q33",
    partId: "part-3",
    questionNumber: 33,
    passageGroupId: "part3-group-1",
    passage: "W: Have you heard? The company is moving our department to the new building on Harbor Road next month.\nM: Really? That's quite far from here. Will the shuttle service still be available?\nW: Yes, they said the shuttle will run every fifteen minutes during rush hour. And the new office has much better facilities — a gym and a cafeteria on the ground floor.\nM: That sounds great. I just hope the commute won't be too long.",
    stem: "How often will the shuttle run during rush hour?",
    options: [
      { label: "A", text: "Every ten minutes" },
      { label: "B", text: "Every fifteen minutes" },
      { label: "C", text: "Every twenty minutes" },
      { label: "D", text: "Every thirty minutes" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q34",
    partId: "part-3",
    questionNumber: 34,
    passageGroupId: "part3-group-1",
    passage: "W: Have you heard? The company is moving our department to the new building on Harbor Road next month.\nM: Really? That's quite far from here. Will the shuttle service still be available?\nW: Yes, they said the shuttle will run every fifteen minutes during rush hour. And the new office has much better facilities — a gym and a cafeteria on the ground floor.\nM: That sounds great. I just hope the commute won't be too long.",
    stem: "What is the man concerned about?",
    options: [
      { label: "A", text: "The cost of the shuttle" },
      { label: "B", text: "The quality of the cafeteria" },
      { label: "C", text: "The length of his commute" },
      { label: "D", text: "The size of the new office" }
    ],
    correctAnswer: "C"
  },

  // Group 2 (Q35-37) — Hotel reservation
  {
    id: "lr-2022-1-q35",
    partId: "part-3",
    questionNumber: 35,
    passageGroupId: "part3-group-2",
    passage: "M: Good morning, I'd like to book a room for three nights starting September twelfth.\nW: Certainly. We have a standard room at one hundred twenty dollars per night, or a deluxe suite at two hundred dollars.\nM: I'll take the standard room. Can I also arrange a late checkout on the fifteenth?\nW: Of course. Late checkout is available until one P.M. for an additional twenty-dollar fee.",
    stem: "What is the man doing?",
    options: [
      { label: "A", text: "Checking out of a hotel" },
      { label: "B", text: "Reserving a hotel room" },
      { label: "C", text: "Complaining about a charge" },
      { label: "D", text: "Requesting a room upgrade" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q36",
    partId: "part-3",
    questionNumber: 36,
    passageGroupId: "part3-group-2",
    passage: "M: Good morning, I'd like to book a room for three nights starting September twelfth.\nW: Certainly. We have a standard room at one hundred twenty dollars per night, or a deluxe suite at two hundred dollars.\nM: I'll take the standard room. Can I also arrange a late checkout on the fifteenth?\nW: Of course. Late checkout is available until one P.M. for an additional twenty-dollar fee.",
    stem: "How much will the man pay per night?",
    options: [
      { label: "A", text: "$100" },
      { label: "B", text: "$120" },
      { label: "C", text: "$150" },
      { label: "D", text: "$200" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q37",
    partId: "part-3",
    questionNumber: 37,
    passageGroupId: "part3-group-2",
    passage: "M: Good morning, I'd like to book a room for three nights starting September twelfth.\nW: Certainly. We have a standard room at one hundred twenty dollars per night, or a deluxe suite at two hundred dollars.\nM: I'll take the standard room. Can I also arrange a late checkout on the fifteenth?\nW: Of course. Late checkout is available until one P.M. for an additional twenty-dollar fee.",
    stem: "What additional service does the man request?",
    options: [
      { label: "A", text: "Room service" },
      { label: "B", text: "Airport shuttle" },
      { label: "C", text: "Late checkout" },
      { label: "D", text: "Extra towels" }
    ],
    correctAnswer: "C"
  },

  // Group 3 (Q38-40) — Project deadline
  {
    id: "lr-2022-1-q38",
    partId: "part-3",
    questionNumber: 38,
    passageGroupId: "part3-group-3",
    passage: "W: David, have you finished the marketing proposal? The client wants it by Wednesday.\nM: I'm almost done with the market analysis section, but I still need the sales data from Kevin's team.\nW: I'll send Kevin a reminder right away. Can you have the proposal ready by Tuesday so I can review it before we submit?\nM: That should be possible if I get the data by tomorrow morning.",
    stem: "What does the woman ask the man to do?",
    options: [
      { label: "A", text: "Contact Kevin directly" },
      { label: "B", text: "Postpone the deadline" },
      { label: "C", text: "Complete the proposal by Tuesday" },
      { label: "D", text: "Revise the sales data" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q39",
    partId: "part-3",
    questionNumber: 39,
    passageGroupId: "part3-group-3",
    passage: "W: David, have you finished the marketing proposal? The client wants it by Wednesday.\nM: I'm almost done with the market analysis section, but I still need the sales data from Kevin's team.\nW: I'll send Kevin a reminder right away. Can you have the proposal ready by Tuesday so I can review it before we submit?\nM: That should be possible if I get the data by tomorrow morning.",
    stem: "What is the man waiting for?",
    options: [
      { label: "A", text: "Approval from the client" },
      { label: "B", text: "Sales data from another team" },
      { label: "C", text: "A revised deadline" },
      { label: "D", text: "Feedback on his analysis" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q40",
    partId: "part-3",
    questionNumber: 40,
    passageGroupId: "part3-group-3",
    passage: "W: David, have you finished the marketing proposal? The client wants it by Wednesday.\nM: I'm almost done with the market analysis section, but I still need the sales data from Kevin's team.\nW: I'll send Kevin a reminder right away. Can you have the proposal ready by Tuesday so I can review it before we submit?\nM: That should be possible if I get the data by tomorrow morning.",
    stem: "What will the woman do next?",
    options: [
      { label: "A", text: "Write the proposal herself" },
      { label: "B", text: "Call the client" },
      { label: "C", text: "Send a reminder to Kevin" },
      { label: "D", text: "Review the sales figures" }
    ],
    correctAnswer: "C"
  },

  // Group 4 (Q41-43) — Printer issue
  {
    id: "lr-2022-1-q41",
    partId: "part-3",
    questionNumber: 41,
    passageGroupId: "part3-group-4",
    passage: "M: Excuse me, the printer on the second floor keeps jamming. I have documents I need to print for this afternoon's meeting.\nW: I'm sorry about that. A technician is coming to fix it at two o'clock. In the meantime, you can use the color printer in Room 305.\nM: Thanks. Do I need a special access code for that one?\nW: Yes, the code is 7749. I'll also email it to you just in case.",
    stem: "What problem does the man report?",
    options: [
      { label: "A", text: "A printer is not working properly." },
      { label: "B", text: "His computer has crashed." },
      { label: "C", text: "He cannot find the meeting room." },
      { label: "D", text: "He lost his access badge." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q42",
    partId: "part-3",
    questionNumber: 42,
    passageGroupId: "part3-group-4",
    passage: "M: Excuse me, the printer on the second floor keeps jamming. I have documents I need to print for this afternoon's meeting.\nW: I'm sorry about that. A technician is coming to fix it at two o'clock. In the meantime, you can use the color printer in Room 305.\nM: Thanks. Do I need a special access code for that one?\nW: Yes, the code is 7749. I'll also email it to you just in case.",
    stem: "What does the woman suggest the man do?",
    options: [
      { label: "A", text: "Wait for the technician" },
      { label: "B", text: "Use a different printer" },
      { label: "C", text: "Print the documents at home" },
      { label: "D", text: "Cancel the afternoon meeting" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q43",
    partId: "part-3",
    questionNumber: 43,
    passageGroupId: "part3-group-4",
    passage: "M: Excuse me, the printer on the second floor keeps jamming. I have documents I need to print for this afternoon's meeting.\nW: I'm sorry about that. A technician is coming to fix it at two o'clock. In the meantime, you can use the color printer in Room 305.\nM: Thanks. Do I need a special access code for that one?\nW: Yes, the code is 7749. I'll also email it to you just in case.",
    stem: "What will the woman email to the man?",
    options: [
      { label: "A", text: "The technician's schedule" },
      { label: "B", text: "The meeting agenda" },
      { label: "C", text: "The printer access code" },
      { label: "D", text: "The documents he needs" }
    ],
    correctAnswer: "C"
  },

  // Group 5 (Q44-46) — Conference registration
  {
    id: "lr-2022-1-q44",
    partId: "part-3",
    questionNumber: 44,
    passageGroupId: "part3-group-5",
    passage: "W: I'd like to register for the International Marketing Conference in November. Is the early bird discount still available?\nM: I'm afraid the early bird rate ended last Friday. The standard registration fee is four hundred fifty dollars.\nW: That's more than I expected. Does the fee include the workshop sessions on the second day?\nM: Yes, all workshops are included, along with lunch and refreshments for both days.",
    stem: "What does the woman want to do?",
    options: [
      { label: "A", text: "Organize a marketing event" },
      { label: "B", text: "Register for a conference" },
      { label: "C", text: "Book a workshop venue" },
      { label: "D", text: "Cancel a registration" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q45",
    partId: "part-3",
    questionNumber: 45,
    passageGroupId: "part3-group-5",
    passage: "W: I'd like to register for the International Marketing Conference in November. Is the early bird discount still available?\nM: I'm afraid the early bird rate ended last Friday. The standard registration fee is four hundred fifty dollars.\nW: That's more than I expected. Does the fee include the workshop sessions on the second day?\nM: Yes, all workshops are included, along with lunch and refreshments for both days.",
    stem: "Why is the woman surprised?",
    options: [
      { label: "A", text: "The conference has been cancelled." },
      { label: "B", text: "The location has changed." },
      { label: "C", text: "The registration fee is higher than expected." },
      { label: "D", text: "The workshops are sold out." }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q46",
    partId: "part-3",
    questionNumber: 46,
    passageGroupId: "part3-group-5",
    passage: "W: I'd like to register for the International Marketing Conference in November. Is the early bird discount still available?\nM: I'm afraid the early bird rate ended last Friday. The standard registration fee is four hundred fifty dollars.\nW: That's more than I expected. Does the fee include the workshop sessions on the second day?\nM: Yes, all workshops are included, along with lunch and refreshments for both days.",
    stem: "What is included in the registration fee?",
    options: [
      { label: "A", text: "Hotel accommodation" },
      { label: "B", text: "Transportation to the venue" },
      { label: "C", text: "Workshops, lunch, and refreshments" },
      { label: "D", text: "A certificate of attendance" }
    ],
    correctAnswer: "C"
  },

  // Group 6 (Q47-49) — Job interview
  {
    id: "lr-2022-1-q47",
    partId: "part-3",
    questionNumber: 47,
    passageGroupId: "part3-group-6",
    passage: "M: Thank you for coming in today, Ms. Park. I see you have five years of experience in supply chain management.\nW: Yes, I managed the logistics division at Greenfield Industries before relocating here.\nM: Impressive. This role involves coordinating with overseas suppliers. Are you comfortable working across different time zones?\nW: Absolutely. At my previous job, I regularly coordinated shipments with partners in Europe and Southeast Asia.",
    stem: "What is the purpose of the conversation?",
    options: [
      { label: "A", text: "To discuss a shipping delay" },
      { label: "B", text: "To conduct a job interview" },
      { label: "C", text: "To negotiate a supplier contract" },
      { label: "D", text: "To plan an overseas trip" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q48",
    partId: "part-3",
    questionNumber: 48,
    passageGroupId: "part3-group-6",
    passage: "M: Thank you for coming in today, Ms. Park. I see you have five years of experience in supply chain management.\nW: Yes, I managed the logistics division at Greenfield Industries before relocating here.\nM: Impressive. This role involves coordinating with overseas suppliers. Are you comfortable working across different time zones?\nW: Absolutely. At my previous job, I regularly coordinated shipments with partners in Europe and Southeast Asia.",
    stem: "What did the woman do at her previous company?",
    options: [
      { label: "A", text: "She managed the logistics division." },
      { label: "B", text: "She designed marketing campaigns." },
      { label: "C", text: "She trained new employees." },
      { label: "D", text: "She developed software." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q49",
    partId: "part-3",
    questionNumber: 49,
    passageGroupId: "part3-group-6",
    passage: "M: Thank you for coming in today, Ms. Park. I see you have five years of experience in supply chain management.\nW: Yes, I managed the logistics division at Greenfield Industries before relocating here.\nM: Impressive. This role involves coordinating with overseas suppliers. Are you comfortable working across different time zones?\nW: Absolutely. At my previous job, I regularly coordinated shipments with partners in Europe and Southeast Asia.",
    stem: "What does the man ask about?",
    options: [
      { label: "A", text: "Her salary expectations" },
      { label: "B", text: "Her availability to start" },
      { label: "C", text: "Her experience working across time zones" },
      { label: "D", text: "Her knowledge of specific software" }
    ],
    correctAnswer: "C"
  },

  // Group 7 (Q50-52) — Restaurant catering
  {
    id: "lr-2022-1-q50",
    partId: "part-3",
    questionNumber: 50,
    passageGroupId: "part3-group-7",
    passage: "W: Hi, I'm calling to arrange catering for our company's anniversary dinner. We'll need meals for about eighty people.\nM: We'd be happy to help. When is the event?\nW: It's on October tenth, a Saturday evening. We'd like a three-course meal with vegetarian options available.\nM: No problem. I'll prepare a quote and send it to you by tomorrow afternoon.",
    stem: "Why is the woman calling?",
    options: [
      { label: "A", text: "To make a dinner reservation" },
      { label: "B", text: "To arrange catering for an event" },
      { label: "C", text: "To complain about food quality" },
      { label: "D", text: "To cancel a previous order" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q51",
    partId: "part-3",
    questionNumber: 51,
    passageGroupId: "part3-group-7",
    passage: "W: Hi, I'm calling to arrange catering for our company's anniversary dinner. We'll need meals for about eighty people.\nM: We'd be happy to help. When is the event?\nW: It's on October tenth, a Saturday evening. We'd like a three-course meal with vegetarian options available.\nM: No problem. I'll prepare a quote and send it to you by tomorrow afternoon.",
    stem: "How many people will attend the event?",
    options: [
      { label: "A", text: "About fifty" },
      { label: "B", text: "About sixty" },
      { label: "C", text: "About eighty" },
      { label: "D", text: "About one hundred" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q52",
    partId: "part-3",
    questionNumber: 52,
    passageGroupId: "part3-group-7",
    passage: "W: Hi, I'm calling to arrange catering for our company's anniversary dinner. We'll need meals for about eighty people.\nM: We'd be happy to help. When is the event?\nW: It's on October tenth, a Saturday evening. We'd like a three-course meal with vegetarian options available.\nM: No problem. I'll prepare a quote and send it to you by tomorrow afternoon.",
    stem: "What will the man do next?",
    options: [
      { label: "A", text: "Visit the event venue" },
      { label: "B", text: "Prepare a price quote" },
      { label: "C", text: "Confirm the guest list" },
      { label: "D", text: "Hire additional staff" }
    ],
    correctAnswer: "B"
  },

  // Group 8 (Q53-55) — Flight change
  {
    id: "lr-2022-1-q53",
    partId: "part-3",
    questionNumber: 53,
    passageGroupId: "part3-group-8",
    passage: "M: I need to change my flight from Seoul to Tokyo. My current booking is for next Monday, but the client meeting has been moved to Wednesday.\nW: Let me check availability. There's a seat on Wednesday morning at nine fifteen, and another on the afternoon flight at two forty-five.\nM: The morning flight would be better. Is there a change fee?\nW: For business class, the change fee is waived. I'll update your reservation now.",
    stem: "Why does the man want to change his flight?",
    options: [
      { label: "A", text: "His meeting was rescheduled." },
      { label: "B", text: "He found a cheaper fare." },
      { label: "C", text: "The flight was cancelled." },
      { label: "D", text: "He needs to visit a different city." }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q54",
    partId: "part-3",
    questionNumber: 54,
    passageGroupId: "part3-group-8",
    passage: "M: I need to change my flight from Seoul to Tokyo. My current booking is for next Monday, but the client meeting has been moved to Wednesday.\nW: Let me check availability. There's a seat on Wednesday morning at nine fifteen, and another on the afternoon flight at two forty-five.\nM: The morning flight would be better. Is there a change fee?\nW: For business class, the change fee is waived. I'll update your reservation now.",
    stem: "Which flight does the man choose?",
    options: [
      { label: "A", text: "Monday morning" },
      { label: "B", text: "Monday afternoon" },
      { label: "C", text: "Wednesday morning" },
      { label: "D", text: "Wednesday afternoon" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q55",
    partId: "part-3",
    questionNumber: 55,
    passageGroupId: "part3-group-8",
    passage: "M: I need to change my flight from Seoul to Tokyo. My current booking is for next Monday, but the client meeting has been moved to Wednesday.\nW: Let me check availability. There's a seat on Wednesday morning at nine fifteen, and another on the afternoon flight at two forty-five.\nM: The morning flight would be better. Is there a change fee?\nW: For business class, the change fee is waived. I'll update your reservation now.",
    stem: "What does the woman say about the change fee?",
    options: [
      { label: "A", text: "It costs fifty dollars." },
      { label: "B", text: "It is included in the ticket price." },
      { label: "C", text: "It has been waived for business class." },
      { label: "D", text: "It must be paid at the airport." }
    ],
    correctAnswer: "C"
  },

  // Group 9 (Q56-58) — Office renovation
  {
    id: "lr-2022-1-q56",
    partId: "part-3",
    questionNumber: 56,
    passageGroupId: "part3-group-9",
    passage: "W: I noticed the third-floor break room is closed. What's going on?\nM: They're renovating it. They're adding new appliances and a larger seating area.\nW: That's nice. How long will the renovation take?\nM: The contractor said it should be done in about two weeks. Until then, we can use the break room on the fifth floor.",
    stem: "What is happening on the third floor?",
    options: [
      { label: "A", text: "A meeting is taking place." },
      { label: "B", text: "The break room is being renovated." },
      { label: "C", text: "New offices are being set up." },
      { label: "D", text: "Equipment is being moved." }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q57",
    partId: "part-3",
    questionNumber: 57,
    passageGroupId: "part3-group-9",
    passage: "W: I noticed the third-floor break room is closed. What's going on?\nM: They're renovating it. They're adding new appliances and a larger seating area.\nW: That's nice. How long will the renovation take?\nM: The contractor said it should be done in about two weeks. Until then, we can use the break room on the fifth floor.",
    stem: "How long will the renovation take?",
    options: [
      { label: "A", text: "About one week" },
      { label: "B", text: "About two weeks" },
      { label: "C", text: "About one month" },
      { label: "D", text: "About three days" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q58",
    partId: "part-3",
    questionNumber: 58,
    passageGroupId: "part3-group-9",
    passage: "W: I noticed the third-floor break room is closed. What's going on?\nM: They're renovating it. They're adding new appliances and a larger seating area.\nW: That's nice. How long will the renovation take?\nM: The contractor said it should be done in about two weeks. Until then, we can use the break room on the fifth floor.",
    stem: "Where can employees go in the meantime?",
    options: [
      { label: "A", text: "The second-floor lounge" },
      { label: "B", text: "The cafeteria downstairs" },
      { label: "C", text: "The fifth-floor break room" },
      { label: "D", text: "A nearby restaurant" }
    ],
    correctAnswer: "C"
  },

  // Group 10 (Q59-61) — Shipping delay
  {
    id: "lr-2022-1-q59",
    partId: "part-3",
    questionNumber: 59,
    passageGroupId: "part3-group-10",
    passage: "M: I'm calling about order number B-4520. It was supposed to arrive last Thursday, but we still haven't received it.\nW: I'm sorry for the inconvenience. Let me look into that. It seems the shipment was delayed due to severe weather in the region.\nM: I understand, but we need those parts for production. Can you expedite the delivery?\nW: I'll arrange express shipping at no extra charge. You should receive the order by Monday.",
    stem: "Why is the man calling?",
    options: [
      { label: "A", text: "To place a new order" },
      { label: "B", text: "To inquire about a late delivery" },
      { label: "C", text: "To return defective merchandise" },
      { label: "D", text: "To request a price adjustment" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q60",
    partId: "part-3",
    questionNumber: 60,
    passageGroupId: "part3-group-10",
    passage: "M: I'm calling about order number B-4520. It was supposed to arrive last Thursday, but we still haven't received it.\nW: I'm sorry for the inconvenience. Let me look into that. It seems the shipment was delayed due to severe weather in the region.\nM: I understand, but we need those parts for production. Can you expedite the delivery?\nW: I'll arrange express shipping at no extra charge. You should receive the order by Monday.",
    stem: "What caused the delay?",
    options: [
      { label: "A", text: "A factory closure" },
      { label: "B", text: "An incorrect address" },
      { label: "C", text: "Severe weather conditions" },
      { label: "D", text: "A shortage of drivers" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q61",
    partId: "part-3",
    questionNumber: 61,
    passageGroupId: "part3-group-10",
    passage: "M: I'm calling about order number B-4520. It was supposed to arrive last Thursday, but we still haven't received it.\nW: I'm sorry for the inconvenience. Let me look into that. It seems the shipment was delayed due to severe weather in the region.\nM: I understand, but we need those parts for production. Can you expedite the delivery?\nW: I'll arrange express shipping at no extra charge. You should receive the order by Monday.",
    stem: "What does the woman offer to do?",
    options: [
      { label: "A", text: "Provide a full refund" },
      { label: "B", text: "Send a replacement order" },
      { label: "C", text: "Arrange free express shipping" },
      { label: "D", text: "Offer a discount on the next order" }
    ],
    correctAnswer: "C"
  },

  // Group 11 (Q62-64) — Training program
  {
    id: "lr-2022-1-q62",
    partId: "part-3",
    questionNumber: 62,
    passageGroupId: "part3-group-11",
    passage: "W: Are you planning to sign up for the leadership training program next quarter?\nM: I was thinking about it, but I'm not sure I can commit to every Saturday for six weeks.\nW: Actually, they've changed the schedule. It's now offered on Wednesday evenings, from six to eight P.M.\nM: Oh, that's much more convenient. I'll register this week.",
    stem: "What is the man considering?",
    options: [
      { label: "A", text: "Changing his work schedule" },
      { label: "B", text: "Enrolling in a training program" },
      { label: "C", text: "Starting a new business" },
      { label: "D", text: "Hiring a personal coach" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q63",
    partId: "part-3",
    questionNumber: 63,
    passageGroupId: "part3-group-11",
    passage: "W: Are you planning to sign up for the leadership training program next quarter?\nM: I was thinking about it, but I'm not sure I can commit to every Saturday for six weeks.\nW: Actually, they've changed the schedule. It's now offered on Wednesday evenings, from six to eight P.M.\nM: Oh, that's much more convenient. I'll register this week.",
    stem: "When is the program now held?",
    options: [
      { label: "A", text: "Saturday mornings" },
      { label: "B", text: "Tuesday afternoons" },
      { label: "C", text: "Wednesday evenings" },
      { label: "D", text: "Thursday mornings" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q64",
    partId: "part-3",
    questionNumber: 64,
    passageGroupId: "part3-group-11",
    passage: "W: Are you planning to sign up for the leadership training program next quarter?\nM: I was thinking about it, but I'm not sure I can commit to every Saturday for six weeks.\nW: Actually, they've changed the schedule. It's now offered on Wednesday evenings, from six to eight P.M.\nM: Oh, that's much more convenient. I'll register this week.",
    stem: "What will the man probably do?",
    options: [
      { label: "A", text: "Ask for more information" },
      { label: "B", text: "Register for the program" },
      { label: "C", text: "Decline the opportunity" },
      { label: "D", text: "Suggest a different schedule" }
    ],
    correctAnswer: "B"
  },

  // Group 12 (Q65-67) — Office supplies order
  {
    id: "lr-2022-1-q65",
    partId: "part-3",
    questionNumber: 65,
    passageGroupId: "part3-group-12",
    passage: "M: Sandra, I noticed we're running low on printer paper and toner cartridges. Should I place an order?\nW: Yes, please. Also add sticky notes and whiteboard markers to the list. We're almost out of those too.\nM: Got it. Should I use our regular supplier, or did you want to try the new one that gave us a quote last week?\nW: Let's stick with the regular one. Their delivery is always reliable.",
    stem: "What does the man want to do?",
    options: [
      { label: "A", text: "Repair the printer" },
      { label: "B", text: "Order office supplies" },
      { label: "C", text: "Set up a new workspace" },
      { label: "D", text: "Return unused supplies" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q66",
    partId: "part-3",
    questionNumber: 66,
    passageGroupId: "part3-group-12",
    passage: "M: Sandra, I noticed we're running low on printer paper and toner cartridges. Should I place an order?\nW: Yes, please. Also add sticky notes and whiteboard markers to the list. We're almost out of those too.\nM: Got it. Should I use our regular supplier, or did you want to try the new one that gave us a quote last week?\nW: Let's stick with the regular one. Their delivery is always reliable.",
    stem: "What additional items does the woman request?",
    options: [
      { label: "A", text: "Envelopes and stamps" },
      { label: "B", text: "Sticky notes and whiteboard markers" },
      { label: "C", text: "Pens and folders" },
      { label: "D", text: "Binders and paper clips" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q67",
    partId: "part-3",
    questionNumber: 67,
    passageGroupId: "part3-group-12",
    passage: "M: Sandra, I noticed we're running low on printer paper and toner cartridges. Should I place an order?\nW: Yes, please. Also add sticky notes and whiteboard markers to the list. We're almost out of those too.\nM: Got it. Should I use our regular supplier, or did you want to try the new one that gave us a quote last week?\nW: Let's stick with the regular one. Their delivery is always reliable.",
    stem: "Why does the woman prefer the regular supplier?",
    options: [
      { label: "A", text: "Their prices are lower." },
      { label: "B", text: "They offer free samples." },
      { label: "C", text: "Their delivery is reliable." },
      { label: "D", text: "They provide a wider selection." }
    ],
    correctAnswer: "C"
  },

  // Group 13 (Q68-70) — Parking lot construction
  {
    id: "lr-2022-1-q68",
    partId: "part-3",
    questionNumber: 68,
    passageGroupId: "part3-group-13",
    passage: "W: Did you see the notice about the parking lot? It's going to be closed for construction starting next week.\nM: Yes, I did. They said employees can park at the municipal garage on Oak Street. The company will cover the cost.\nW: That's good to know. How long is the construction expected to last?\nM: About three months. They're adding fifty more spaces and installing electric vehicle charging stations.",
    stem: "What will happen to the parking lot?",
    options: [
      { label: "A", text: "It will be converted into a park." },
      { label: "B", text: "It will be closed for construction." },
      { label: "C", text: "Its fees will increase." },
      { label: "D", text: "Its hours will be extended." }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q69",
    partId: "part-3",
    questionNumber: 69,
    passageGroupId: "part3-group-13",
    passage: "W: Did you see the notice about the parking lot? It's going to be closed for construction starting next week.\nM: Yes, I did. They said employees can park at the municipal garage on Oak Street. The company will cover the cost.\nW: That's good to know. How long is the construction expected to last?\nM: About three months. They're adding fifty more spaces and installing electric vehicle charging stations.",
    stem: "Who will pay for the alternative parking?",
    options: [
      { label: "A", text: "The employees" },
      { label: "B", text: "The construction company" },
      { label: "C", text: "The employer" },
      { label: "D", text: "The municipal government" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q70",
    partId: "part-3",
    questionNumber: 70,
    passageGroupId: "part3-group-13",
    passage: "W: Did you see the notice about the parking lot? It's going to be closed for construction starting next week.\nM: Yes, I did. They said employees can park at the municipal garage on Oak Street. The company will cover the cost.\nW: That's good to know. How long is the construction expected to last?\nM: About three months. They're adding fifty more spaces and installing electric vehicle charging stations.",
    stem: "What improvement is being made to the parking lot?",
    options: [
      { label: "A", text: "A security system will be installed." },
      { label: "B", text: "The surface will be repainted." },
      { label: "C", text: "More spaces and charging stations will be added." },
      { label: "D", text: "A new entrance will be built." }
    ],
    correctAnswer: "C"
  }
];

// ---------------------------------------------------------------------------
// Part 4 — Short Talks (Q71-100) — 10 groups × 3 questions
// ---------------------------------------------------------------------------

const part4Questions: ToeicQuestion[] = [
  // Group 1 (Q71-73) — Airport announcement
  {
    id: "lr-2022-1-q71",
    partId: "part-4",
    questionNumber: 71,
    passageGroupId: "part4-group-1",
    passage: "Attention all passengers on Flight 472 to London Heathrow. Due to a mechanical issue, your departure has been delayed by approximately ninety minutes. The new estimated departure time is three forty-five P.M. We apologize for the inconvenience. Complimentary meal vouchers are available at the customer service desk near Gate 14.",
    stem: "What is the announcement about?",
    options: [
      { label: "A", text: "A gate change" },
      { label: "B", text: "A flight delay" },
      { label: "C", text: "A flight cancellation" },
      { label: "D", text: "A boarding procedure change" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q72",
    partId: "part-4",
    questionNumber: 72,
    passageGroupId: "part4-group-1",
    passage: "Attention all passengers on Flight 472 to London Heathrow. Due to a mechanical issue, your departure has been delayed by approximately ninety minutes. The new estimated departure time is three forty-five P.M. We apologize for the inconvenience. Complimentary meal vouchers are available at the customer service desk near Gate 14.",
    stem: "How long is the delay?",
    options: [
      { label: "A", text: "Thirty minutes" },
      { label: "B", text: "Sixty minutes" },
      { label: "C", text: "Ninety minutes" },
      { label: "D", text: "Two hours" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q73",
    partId: "part-4",
    questionNumber: 73,
    passageGroupId: "part4-group-1",
    passage: "Attention all passengers on Flight 472 to London Heathrow. Due to a mechanical issue, your departure has been delayed by approximately ninety minutes. The new estimated departure time is three forty-five P.M. We apologize for the inconvenience. Complimentary meal vouchers are available at the customer service desk near Gate 14.",
    stem: "What are passengers offered?",
    options: [
      { label: "A", text: "A seat upgrade" },
      { label: "B", text: "Free meal vouchers" },
      { label: "C", text: "A refund on their ticket" },
      { label: "D", text: "Access to the business lounge" }
    ],
    correctAnswer: "B"
  },

  // Group 2 (Q74-76) — Company earnings call
  {
    id: "lr-2022-1-q74",
    partId: "part-4",
    questionNumber: 74,
    passageGroupId: "part4-group-2",
    passage: "Good afternoon, everyone, and thank you for joining our third-quarter earnings call. I'm pleased to report that total revenue increased by twelve percent compared to the same period last year, reaching four hundred twenty million dollars. Our growth was driven primarily by strong performance in the Asia-Pacific region. We also reduced operating expenses by three percent through our efficiency initiatives. Looking ahead, we expect continued growth in the fourth quarter.",
    stem: "What is the speaker reporting on?",
    options: [
      { label: "A", text: "A product launch" },
      { label: "B", text: "Quarterly financial results" },
      { label: "C", text: "Employee performance reviews" },
      { label: "D", text: "A merger announcement" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q75",
    partId: "part-4",
    questionNumber: 75,
    passageGroupId: "part4-group-2",
    passage: "Good afternoon, everyone, and thank you for joining our third-quarter earnings call. I'm pleased to report that total revenue increased by twelve percent compared to the same period last year, reaching four hundred twenty million dollars. Our growth was driven primarily by strong performance in the Asia-Pacific region. We also reduced operating expenses by three percent through our efficiency initiatives. Looking ahead, we expect continued growth in the fourth quarter.",
    stem: "By how much did revenue increase?",
    options: [
      { label: "A", text: "Three percent" },
      { label: "B", text: "Eight percent" },
      { label: "C", text: "Twelve percent" },
      { label: "D", text: "Twenty percent" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q76",
    partId: "part-4",
    questionNumber: 76,
    passageGroupId: "part4-group-2",
    passage: "Good afternoon, everyone, and thank you for joining our third-quarter earnings call. I'm pleased to report that total revenue increased by twelve percent compared to the same period last year, reaching four hundred twenty million dollars. Our growth was driven primarily by strong performance in the Asia-Pacific region. We also reduced operating expenses by three percent through our efficiency initiatives. Looking ahead, we expect continued growth in the fourth quarter.",
    stem: "Which region drove the company's growth?",
    options: [
      { label: "A", text: "North America" },
      { label: "B", text: "Europe" },
      { label: "C", text: "Latin America" },
      { label: "D", text: "Asia-Pacific" }
    ],
    correctAnswer: "D"
  },

  // Group 3 (Q77-79) — Store opening announcement
  {
    id: "lr-2022-1-q77",
    partId: "part-4",
    questionNumber: 77,
    passageGroupId: "part4-group-3",
    passage: "We are excited to announce the grand opening of our newest Greenfield Organic Market location on Maple Avenue this Saturday, March eighteenth. The first one hundred customers will receive a complimentary reusable shopping bag. We'll also be offering twenty percent off all fresh produce throughout the opening weekend. Store hours will be eight A.M. to nine P.M., seven days a week.",
    stem: "What is being announced?",
    options: [
      { label: "A", text: "A store closing" },
      { label: "B", text: "A new product line" },
      { label: "C", text: "A store grand opening" },
      { label: "D", text: "A change in store hours" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q78",
    partId: "part-4",
    questionNumber: 78,
    passageGroupId: "part4-group-3",
    passage: "We are excited to announce the grand opening of our newest Greenfield Organic Market location on Maple Avenue this Saturday, March eighteenth. The first one hundred customers will receive a complimentary reusable shopping bag. We'll also be offering twenty percent off all fresh produce throughout the opening weekend. Store hours will be eight A.M. to nine P.M., seven days a week.",
    stem: "What will the first one hundred customers receive?",
    options: [
      { label: "A", text: "A gift card" },
      { label: "B", text: "A free shopping bag" },
      { label: "C", text: "A box of fresh produce" },
      { label: "D", text: "A discount coupon" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q79",
    partId: "part-4",
    questionNumber: 79,
    passageGroupId: "part4-group-3",
    passage: "We are excited to announce the grand opening of our newest Greenfield Organic Market location on Maple Avenue this Saturday, March eighteenth. The first one hundred customers will receive a complimentary reusable shopping bag. We'll also be offering twenty percent off all fresh produce throughout the opening weekend. Store hours will be eight A.M. to nine P.M., seven days a week.",
    stem: "What discount is being offered on produce?",
    options: [
      { label: "A", text: "Ten percent" },
      { label: "B", text: "Fifteen percent" },
      { label: "C", text: "Twenty percent" },
      { label: "D", text: "Thirty percent" }
    ],
    correctAnswer: "C"
  },

  // Group 4 (Q80-82) — Voicemail message
  {
    id: "lr-2022-1-q80",
    partId: "part-4",
    questionNumber: 80,
    passageGroupId: "part4-group-4",
    passage: "Hello, Ms. Rodriguez. This is James at Prestige Auto Service. I'm calling to let you know that your vehicle is ready for pickup. We replaced the brake pads and rotated the tires as requested. The total comes to three hundred and fifteen dollars. We're open until six P.M. today and from eight A.M. to five P.M. on Saturday. Please bring your claim ticket when you come.",
    stem: "Who is the message for?",
    options: [
      { label: "A", text: "A car dealership manager" },
      { label: "B", text: "A vehicle owner" },
      { label: "C", text: "An insurance agent" },
      { label: "D", text: "A delivery driver" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q81",
    partId: "part-4",
    questionNumber: 81,
    passageGroupId: "part4-group-4",
    passage: "Hello, Ms. Rodriguez. This is James at Prestige Auto Service. I'm calling to let you know that your vehicle is ready for pickup. We replaced the brake pads and rotated the tires as requested. The total comes to three hundred and fifteen dollars. We're open until six P.M. today and from eight A.M. to five P.M. on Saturday. Please bring your claim ticket when you come.",
    stem: "What work was done on the vehicle?",
    options: [
      { label: "A", text: "Oil change and engine check" },
      { label: "B", text: "Brake pad replacement and tire rotation" },
      { label: "C", text: "Windshield repair and paint touch-up" },
      { label: "D", text: "Battery replacement and alignment" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q82",
    partId: "part-4",
    questionNumber: 82,
    passageGroupId: "part4-group-4",
    passage: "Hello, Ms. Rodriguez. This is James at Prestige Auto Service. I'm calling to let you know that your vehicle is ready for pickup. We replaced the brake pads and rotated the tires as requested. The total comes to three hundred and fifteen dollars. We're open until six P.M. today and from eight A.M. to five P.M. on Saturday. Please bring your claim ticket when you come.",
    stem: "What should Ms. Rodriguez bring?",
    options: [
      { label: "A", text: "Her driver's license" },
      { label: "B", text: "Her insurance card" },
      { label: "C", text: "Her claim ticket" },
      { label: "D", text: "Her payment receipt" }
    ],
    correctAnswer: "C"
  },

  // Group 5 (Q83-85) — Weather report
  {
    id: "lr-2022-1-q83",
    partId: "part-4",
    questionNumber: 83,
    passageGroupId: "part4-group-5",
    passage: "Good morning, and here's your weekend weather forecast. Today will be mostly sunny with a high of twenty-eight degrees Celsius. However, a cold front is expected to move in Saturday evening, bringing rain and thunderstorms through Sunday afternoon. Temperatures will drop to about eighteen degrees. If you have outdoor plans for Sunday, you may want to reschedule or prepare for wet conditions.",
    stem: "What will the weather be like today?",
    options: [
      { label: "A", text: "Rainy and cold" },
      { label: "B", text: "Mostly sunny" },
      { label: "C", text: "Cloudy with fog" },
      { label: "D", text: "Snowy" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q84",
    partId: "part-4",
    questionNumber: 84,
    passageGroupId: "part4-group-5",
    passage: "Good morning, and here's your weekend weather forecast. Today will be mostly sunny with a high of twenty-eight degrees Celsius. However, a cold front is expected to move in Saturday evening, bringing rain and thunderstorms through Sunday afternoon. Temperatures will drop to about eighteen degrees. If you have outdoor plans for Sunday, you may want to reschedule or prepare for wet conditions.",
    stem: "When will the rain begin?",
    options: [
      { label: "A", text: "Friday night" },
      { label: "B", text: "Saturday morning" },
      { label: "C", text: "Saturday evening" },
      { label: "D", text: "Sunday morning" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q85",
    partId: "part-4",
    questionNumber: 85,
    passageGroupId: "part4-group-5",
    passage: "Good morning, and here's your weekend weather forecast. Today will be mostly sunny with a high of twenty-eight degrees Celsius. However, a cold front is expected to move in Saturday evening, bringing rain and thunderstorms through Sunday afternoon. Temperatures will drop to about eighteen degrees. If you have outdoor plans for Sunday, you may want to reschedule or prepare for wet conditions.",
    stem: "What does the speaker suggest?",
    options: [
      { label: "A", text: "Avoiding highways on Saturday" },
      { label: "B", text: "Wearing warm clothing today" },
      { label: "C", text: "Rescheduling Sunday outdoor plans" },
      { label: "D", text: "Staying indoors all weekend" }
    ],
    correctAnswer: "C"
  },

  // Group 6 (Q86-88) — Museum tour
  {
    id: "lr-2022-1-q86",
    partId: "part-4",
    questionNumber: 86,
    passageGroupId: "part4-group-6",
    passage: "Welcome to the National Art Museum. Before we begin our guided tour, I'd like to go over a few guidelines. Photography is permitted in most galleries, but please do not use flash. The modern art wing on the second floor is currently closed for renovation and will reopen in April. Our gift shop on the first floor offers a wide selection of art books and prints. The tour will last approximately one hour.",
    stem: "Where is the speaker?",
    options: [
      { label: "A", text: "At a library" },
      { label: "B", text: "At a museum" },
      { label: "C", text: "At a theater" },
      { label: "D", text: "At a university" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q87",
    partId: "part-4",
    questionNumber: 87,
    passageGroupId: "part4-group-6",
    passage: "Welcome to the National Art Museum. Before we begin our guided tour, I'd like to go over a few guidelines. Photography is permitted in most galleries, but please do not use flash. The modern art wing on the second floor is currently closed for renovation and will reopen in April. Our gift shop on the first floor offers a wide selection of art books and prints. The tour will last approximately one hour.",
    stem: "What restriction does the speaker mention?",
    options: [
      { label: "A", text: "No food or drinks allowed" },
      { label: "B", text: "No flash photography" },
      { label: "C", text: "No large bags permitted" },
      { label: "D", text: "No children under twelve" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q88",
    partId: "part-4",
    questionNumber: 88,
    passageGroupId: "part4-group-6",
    passage: "Welcome to the National Art Museum. Before we begin our guided tour, I'd like to go over a few guidelines. Photography is permitted in most galleries, but please do not use flash. The modern art wing on the second floor is currently closed for renovation and will reopen in April. Our gift shop on the first floor offers a wide selection of art books and prints. The tour will last approximately one hour.",
    stem: "What is currently unavailable?",
    options: [
      { label: "A", text: "The gift shop" },
      { label: "B", text: "The sculpture garden" },
      { label: "C", text: "The modern art wing" },
      { label: "D", text: "The parking garage" }
    ],
    correctAnswer: "C"
  },

  // Group 7 (Q89-91) — Company policy update
  {
    id: "lr-2022-1-q89",
    partId: "part-4",
    questionNumber: 89,
    passageGroupId: "part4-group-7",
    passage: "This is a reminder that starting January first, the company will implement a new flexible work policy. Employees may work from home up to two days per week, subject to manager approval. On remote work days, employees must be available during core hours from ten A.M. to three P.M. Please submit your preferred schedule to your department head by December fifteenth.",
    stem: "What change is the company making?",
    options: [
      { label: "A", text: "Reducing working hours" },
      { label: "B", text: "Introducing remote work options" },
      { label: "C", text: "Relocating to a new building" },
      { label: "D", text: "Changing the dress code" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q90",
    partId: "part-4",
    questionNumber: 90,
    passageGroupId: "part4-group-7",
    passage: "This is a reminder that starting January first, the company will implement a new flexible work policy. Employees may work from home up to two days per week, subject to manager approval. On remote work days, employees must be available during core hours from ten A.M. to three P.M. Please submit your preferred schedule to your department head by December fifteenth.",
    stem: "What are the core hours for remote work?",
    options: [
      { label: "A", text: "8 A.M. to 1 P.M." },
      { label: "B", text: "9 A.M. to 2 P.M." },
      { label: "C", text: "10 A.M. to 3 P.M." },
      { label: "D", text: "11 A.M. to 4 P.M." }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q91",
    partId: "part-4",
    questionNumber: 91,
    passageGroupId: "part4-group-7",
    passage: "This is a reminder that starting January first, the company will implement a new flexible work policy. Employees may work from home up to two days per week, subject to manager approval. On remote work days, employees must be available during core hours from ten A.M. to three P.M. Please submit your preferred schedule to your department head by December fifteenth.",
    stem: "What should employees do by December fifteenth?",
    options: [
      { label: "A", text: "Complete a training course" },
      { label: "B", text: "Update their contact information" },
      { label: "C", text: "Submit their preferred schedule" },
      { label: "D", text: "Sign a new contract" }
    ],
    correctAnswer: "C"
  },

  // Group 8 (Q92-94) — Product recall
  {
    id: "lr-2022-1-q92",
    partId: "part-4",
    questionNumber: 92,
    passageGroupId: "part4-group-8",
    passage: "Attention, customers. Bright Kitchen Appliances has issued a voluntary recall of its Model BK-200 electric kettle due to a potential overheating issue. If you purchased this model between June and September of this year, please stop using it immediately and return it to any authorized retailer for a full refund. For more information, visit our website at brightkitchen.com or call our hotline at 1-800-555-0192.",
    stem: "What product is being recalled?",
    options: [
      { label: "A", text: "A microwave oven" },
      { label: "B", text: "An electric kettle" },
      { label: "C", text: "A toaster" },
      { label: "D", text: "A coffee maker" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q93",
    partId: "part-4",
    questionNumber: 93,
    passageGroupId: "part4-group-8",
    passage: "Attention, customers. Bright Kitchen Appliances has issued a voluntary recall of its Model BK-200 electric kettle due to a potential overheating issue. If you purchased this model between June and September of this year, please stop using it immediately and return it to any authorized retailer for a full refund. For more information, visit our website at brightkitchen.com or call our hotline at 1-800-555-0192.",
    stem: "What is the reason for the recall?",
    options: [
      { label: "A", text: "A labeling error" },
      { label: "B", text: "A potential overheating issue" },
      { label: "C", text: "A missing safety feature" },
      { label: "D", text: "Customer complaints about noise" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q94",
    partId: "part-4",
    questionNumber: 94,
    passageGroupId: "part4-group-8",
    passage: "Attention, customers. Bright Kitchen Appliances has issued a voluntary recall of its Model BK-200 electric kettle due to a potential overheating issue. If you purchased this model between June and September of this year, please stop using it immediately and return it to any authorized retailer for a full refund. For more information, visit our website at brightkitchen.com or call our hotline at 1-800-555-0192.",
    stem: "What should affected customers do?",
    options: [
      { label: "A", text: "Contact the manufacturer for repair" },
      { label: "B", text: "Return the product for a full refund" },
      { label: "C", text: "Wait for a replacement to be mailed" },
      { label: "D", text: "Download a software update" }
    ],
    correctAnswer: "B"
  },

  // Group 9 (Q95-97) — Office building tour
  {
    id: "lr-2022-1-q95",
    partId: "part-4",
    questionNumber: 95,
    passageGroupId: "part4-group-9",
    passage: "Good morning, and welcome to Vertex Solutions. I'll be giving you a brief tour of our facilities before your orientation begins. On this floor, you'll find the reception area, visitor lounge, and two meeting rooms. The employee cafeteria is on the second floor, and it serves breakfast and lunch from seven thirty A.M. to one thirty P.M. Your workstations are on the fourth floor. IT support is located on the third floor if you need help setting up your equipment.",
    stem: "Who is the speaker most likely addressing?",
    options: [
      { label: "A", text: "Visiting clients" },
      { label: "B", text: "Construction workers" },
      { label: "C", text: "New employees" },
      { label: "D", text: "Building inspectors" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q96",
    partId: "part-4",
    questionNumber: 96,
    passageGroupId: "part4-group-9",
    passage: "Good morning, and welcome to Vertex Solutions. I'll be giving you a brief tour of our facilities before your orientation begins. On this floor, you'll find the reception area, visitor lounge, and two meeting rooms. The employee cafeteria is on the second floor, and it serves breakfast and lunch from seven thirty A.M. to one thirty P.M. Your workstations are on the fourth floor. IT support is located on the third floor if you need help setting up your equipment.",
    stem: "What time does the cafeteria close?",
    options: [
      { label: "A", text: "12:00 P.M." },
      { label: "B", text: "1:00 P.M." },
      { label: "C", text: "1:30 P.M." },
      { label: "D", text: "2:00 P.M." }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q97",
    partId: "part-4",
    questionNumber: 97,
    passageGroupId: "part4-group-9",
    passage: "Good morning, and welcome to Vertex Solutions. I'll be giving you a brief tour of our facilities before your orientation begins. On this floor, you'll find the reception area, visitor lounge, and two meeting rooms. The employee cafeteria is on the second floor, and it serves breakfast and lunch from seven thirty A.M. to one thirty P.M. Your workstations are on the fourth floor. IT support is located on the third floor if you need help setting up your equipment.",
    stem: "Where is IT support located?",
    options: [
      { label: "A", text: "On the first floor" },
      { label: "B", text: "On the second floor" },
      { label: "C", text: "On the third floor" },
      { label: "D", text: "On the fourth floor" }
    ],
    correctAnswer: "C"
  },

  // Group 10 (Q98-100) — Traffic report
  {
    id: "lr-2022-1-q98",
    partId: "part-4",
    questionNumber: 98,
    passageGroupId: "part4-group-10",
    passage: "And now for your morning traffic update. Commuters heading southbound on Interstate 95 should expect delays of up to forty minutes due to a multi-vehicle accident near Exit 22. Emergency crews are on scene, and two of the three lanes are currently blocked. As an alternative, drivers may use Route 7, which is moving smoothly at this time. We'll have another update for you in thirty minutes.",
    stem: "What is causing the delay?",
    options: [
      { label: "A", text: "Road construction" },
      { label: "B", text: "A vehicle accident" },
      { label: "C", text: "Heavy snowfall" },
      { label: "D", text: "A bridge closure" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q99",
    partId: "part-4",
    questionNumber: 99,
    passageGroupId: "part4-group-10",
    passage: "And now for your morning traffic update. Commuters heading southbound on Interstate 95 should expect delays of up to forty minutes due to a multi-vehicle accident near Exit 22. Emergency crews are on scene, and two of the three lanes are currently blocked. As an alternative, drivers may use Route 7, which is moving smoothly at this time. We'll have another update for you in thirty minutes.",
    stem: "What alternative route is suggested?",
    options: [
      { label: "A", text: "Interstate 90" },
      { label: "B", text: "Highway 10" },
      { label: "C", text: "Route 7" },
      { label: "D", text: "Exit 22" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q100",
    partId: "part-4",
    questionNumber: 100,
    passageGroupId: "part4-group-10",
    passage: "And now for your morning traffic update. Commuters heading southbound on Interstate 95 should expect delays of up to forty minutes due to a multi-vehicle accident near Exit 22. Emergency crews are on scene, and two of the three lanes are currently blocked. As an alternative, drivers may use Route 7, which is moving smoothly at this time. We'll have another update for you in thirty minutes.",
    stem: "When will the next traffic update be provided?",
    options: [
      { label: "A", text: "In fifteen minutes" },
      { label: "B", text: "In thirty minutes" },
      { label: "C", text: "In one hour" },
      { label: "D", text: "At noon" }
    ],
    correctAnswer: "B"
  }
];

// ---------------------------------------------------------------------------
// Part 5 — Incomplete Sentences (Q101-130)
// ---------------------------------------------------------------------------

const part5Questions: ToeicQuestion[] = [
  {
    id: "lr-2022-1-q101",
    partId: "part-5",
    questionNumber: 101,
    stem: "All employees must submit their time sheets ______ the end of each pay period.",
    options: [
      { label: "A", text: "by" },
      { label: "B", text: "until" },
      { label: "C", text: "from" },
      { label: "D", text: "since" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q102",
    partId: "part-5",
    questionNumber: 102,
    stem: "The marketing team prepared a ______ analysis of consumer trends for the quarterly review.",
    options: [
      { label: "A", text: "comprehend" },
      { label: "B", text: "comprehensive" },
      { label: "C", text: "comprehension" },
      { label: "D", text: "comprehensively" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q103",
    partId: "part-5",
    questionNumber: 103,
    stem: "Ms. Nakamura will be ______ for overseeing the merger negotiations with Hartley Corporation.",
    options: [
      { label: "A", text: "responsible" },
      { label: "B", text: "responsibility" },
      { label: "C", text: "responsibly" },
      { label: "D", text: "respond" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q104",
    partId: "part-5",
    questionNumber: 104,
    stem: "The factory will remain closed ______ the safety inspection has been completed.",
    options: [
      { label: "A", text: "during" },
      { label: "B", text: "while" },
      { label: "C", text: "until" },
      { label: "D", text: "since" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q105",
    partId: "part-5",
    questionNumber: 105,
    stem: "Applicants for the position should have at least three years of ______ in project management.",
    options: [
      { label: "A", text: "experiment" },
      { label: "B", text: "experience" },
      { label: "C", text: "experienced" },
      { label: "D", text: "experiencing" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q106",
    partId: "part-5",
    questionNumber: 106,
    stem: "The new accounting software is considerably more ______ than the previous version.",
    options: [
      { label: "A", text: "efficiency" },
      { label: "B", text: "efficient" },
      { label: "C", text: "efficiently" },
      { label: "D", text: "efficiencies" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q107",
    partId: "part-5",
    questionNumber: 107,
    stem: "Please ensure that all confidential documents are stored ______.",
    options: [
      { label: "A", text: "secure" },
      { label: "B", text: "securely" },
      { label: "C", text: "security" },
      { label: "D", text: "secured" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q108",
    partId: "part-5",
    questionNumber: 108,
    stem: "The board of directors voted ______ to approve the proposed expansion plan.",
    options: [
      { label: "A", text: "unanimous" },
      { label: "B", text: "unanimity" },
      { label: "C", text: "unanimously" },
      { label: "D", text: "unanimousness" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q109",
    partId: "part-5",
    questionNumber: 109,
    stem: "Due to the ______ demand for our products, we have increased production capacity.",
    options: [
      { label: "A", text: "grow" },
      { label: "B", text: "grew" },
      { label: "C", text: "grown" },
      { label: "D", text: "growing" }
    ],
    correctAnswer: "D"
  },
  {
    id: "lr-2022-1-q110",
    partId: "part-5",
    questionNumber: 110,
    stem: "Clients who wish to cancel their subscription must provide written ______ at least thirty days in advance.",
    options: [
      { label: "A", text: "notify" },
      { label: "B", text: "notification" },
      { label: "C", text: "notifying" },
      { label: "D", text: "notified" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q111",
    partId: "part-5",
    questionNumber: 111,
    stem: "The conference room on the sixth floor is ______ for the staff meeting this Friday.",
    options: [
      { label: "A", text: "reserved" },
      { label: "B", text: "reserving" },
      { label: "C", text: "reservation" },
      { label: "D", text: "reserve" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q112",
    partId: "part-5",
    questionNumber: 112,
    stem: "Mr. Thompson ______ the sales department for over fifteen years before his promotion.",
    options: [
      { label: "A", text: "manages" },
      { label: "B", text: "managed" },
      { label: "C", text: "has managed" },
      { label: "D", text: "had managed" }
    ],
    correctAnswer: "D"
  },
  {
    id: "lr-2022-1-q113",
    partId: "part-5",
    questionNumber: 113,
    stem: "The ______ of the merger is expected to take approximately six months.",
    options: [
      { label: "A", text: "complete" },
      { label: "B", text: "completing" },
      { label: "C", text: "completion" },
      { label: "D", text: "completely" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q114",
    partId: "part-5",
    questionNumber: 114,
    stem: "Employees are encouraged to ______ in the annual wellness program offered by the company.",
    options: [
      { label: "A", text: "participate" },
      { label: "B", text: "participation" },
      { label: "C", text: "participant" },
      { label: "D", text: "participatory" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q115",
    partId: "part-5",
    questionNumber: 115,
    stem: "The construction of the new headquarters is progressing ______ schedule.",
    options: [
      { label: "A", text: "ahead of" },
      { label: "B", text: "forward to" },
      { label: "C", text: "prior of" },
      { label: "D", text: "along to" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q116",
    partId: "part-5",
    questionNumber: 116,
    stem: "The firm's reputation for ______ customer service has attracted many loyal clients.",
    options: [
      { label: "A", text: "except" },
      { label: "B", text: "exceptional" },
      { label: "C", text: "exception" },
      { label: "D", text: "exceptionally" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q117",
    partId: "part-5",
    questionNumber: 117,
    stem: "All visitors must sign in at the front desk ______ entering the building.",
    options: [
      { label: "A", text: "upon" },
      { label: "B", text: "into" },
      { label: "C", text: "along" },
      { label: "D", text: "toward" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q118",
    partId: "part-5",
    questionNumber: 118,
    stem: "The report suggests that the company's profits have increased ______.",
    options: [
      { label: "A", text: "significance" },
      { label: "B", text: "significant" },
      { label: "C", text: "significantly" },
      { label: "D", text: "signify" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q119",
    partId: "part-5",
    questionNumber: 119,
    stem: "Management has decided to ______ a new policy regarding employee travel expenses.",
    options: [
      { label: "A", text: "implement" },
      { label: "B", text: "implementation" },
      { label: "C", text: "implementing" },
      { label: "D", text: "implemented" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q120",
    partId: "part-5",
    questionNumber: 120,
    stem: "The warranty covers repairs ______ defects in materials and workmanship.",
    options: [
      { label: "A", text: "result from" },
      { label: "B", text: "resulting from" },
      { label: "C", text: "resulted from" },
      { label: "D", text: "results from" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q121",
    partId: "part-5",
    questionNumber: 121,
    stem: "______ the heavy rain, the outdoor event proceeded as planned.",
    options: [
      { label: "A", text: "Although" },
      { label: "B", text: "Because of" },
      { label: "C", text: "Despite" },
      { label: "D", text: "During" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q122",
    partId: "part-5",
    questionNumber: 122,
    stem: "The committee will ______ the proposals and announce its decision next week.",
    options: [
      { label: "A", text: "evaluate" },
      { label: "B", text: "evaluation" },
      { label: "C", text: "evaluative" },
      { label: "D", text: "evaluated" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q123",
    partId: "part-5",
    questionNumber: 123,
    stem: "Tenants are ______ to notify the management office before making any structural changes.",
    options: [
      { label: "A", text: "require" },
      { label: "B", text: "required" },
      { label: "C", text: "requiring" },
      { label: "D", text: "requirement" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q124",
    partId: "part-5",
    questionNumber: 124,
    stem: "The seminar will provide useful ______ for professionals in the healthcare industry.",
    options: [
      { label: "A", text: "insightful" },
      { label: "B", text: "insightfully" },
      { label: "C", text: "insights" },
      { label: "D", text: "insighting" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q125",
    partId: "part-5",
    questionNumber: 125,
    stem: "The product was redesigned to ______ with current safety regulations.",
    options: [
      { label: "A", text: "comply" },
      { label: "B", text: "compliant" },
      { label: "C", text: "compliance" },
      { label: "D", text: "compliantly" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q126",
    partId: "part-5",
    questionNumber: 126,
    stem: "Negotiations between the two companies are expected to conclude ______ the end of the month.",
    options: [
      { label: "A", text: "at" },
      { label: "B", text: "by" },
      { label: "C", text: "on" },
      { label: "D", text: "in" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q127",
    partId: "part-5",
    questionNumber: 127,
    stem: "The advertising campaign was ______ successful in attracting new customers.",
    options: [
      { label: "A", text: "remark" },
      { label: "B", text: "remarkable" },
      { label: "C", text: "remarkably" },
      { label: "D", text: "remarking" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q128",
    partId: "part-5",
    questionNumber: 128,
    stem: "Each department must designate a representative ______ will attend the monthly safety briefings.",
    options: [
      { label: "A", text: "who" },
      { label: "B", text: "whom" },
      { label: "C", text: "whose" },
      { label: "D", text: "which" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q129",
    partId: "part-5",
    questionNumber: 129,
    stem: "The renovation project was completed well ______ the original budget.",
    options: [
      { label: "A", text: "within" },
      { label: "B", text: "between" },
      { label: "C", text: "among" },
      { label: "D", text: "through" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q130",
    partId: "part-5",
    questionNumber: 130,
    stem: "The manager praised the team for ______ completing the project two weeks early.",
    options: [
      { label: "A", text: "success" },
      { label: "B", text: "successful" },
      { label: "C", text: "successfully" },
      { label: "D", text: "succeed" }
    ],
    correctAnswer: "C"
  }
];

// ---------------------------------------------------------------------------
// Part 6 — Text Completion (Q131-146) — 4 groups × 4 questions
// ---------------------------------------------------------------------------

const part6Questions: ToeicQuestion[] = [
  // Group 1 (Q131-134) — Business email about office move
  {
    id: "lr-2022-1-q131",
    partId: "part-6",
    questionNumber: 131,
    passageGroupId: "part6-group-1",
    passage: "To: All Staff\nFrom: Facilities Management\nSubject: Office Relocation Update\n\nDear colleagues,\n\nAs previously announced, our company will be relocating to the new Riverside Tower on March 1. The moving company has been __(131)__ to handle the transfer of all office furniture and equipment.\n\nPlease pack your personal belongings in the boxes that will be __(132)__ to each workstation by February 25. Label each box clearly with your name and new office number.\n\nWe understand that the move may cause some __(133)__, but we are confident the new space will provide a much better working environment. The new building features modern meeting rooms, a rooftop terrace, and improved parking facilities.\n\n__(134)__. If you have any questions, please contact the Facilities Help Desk at extension 2200.\n\nBest regards,\nFacilities Management",
    stem: "Choose the best option for blank (131).",
    options: [
      { label: "A", text: "hired" },
      { label: "B", text: "hiring" },
      { label: "C", text: "hire" },
      { label: "D", text: "hires" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q132",
    partId: "part-6",
    questionNumber: 132,
    passageGroupId: "part6-group-1",
    passage: "To: All Staff\nFrom: Facilities Management\nSubject: Office Relocation Update\n\nDear colleagues,\n\nAs previously announced, our company will be relocating to the new Riverside Tower on March 1. The moving company has been __(131)__ to handle the transfer of all office furniture and equipment.\n\nPlease pack your personal belongings in the boxes that will be __(132)__ to each workstation by February 25. Label each box clearly with your name and new office number.\n\nWe understand that the move may cause some __(133)__, but we are confident the new space will provide a much better working environment. The new building features modern meeting rooms, a rooftop terrace, and improved parking facilities.\n\n__(134)__. If you have any questions, please contact the Facilities Help Desk at extension 2200.\n\nBest regards,\nFacilities Management",
    stem: "Choose the best option for blank (132).",
    options: [
      { label: "A", text: "delivered" },
      { label: "B", text: "delivering" },
      { label: "C", text: "delivery" },
      { label: "D", text: "deliverable" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q133",
    partId: "part-6",
    questionNumber: 133,
    passageGroupId: "part6-group-1",
    passage: "To: All Staff\nFrom: Facilities Management\nSubject: Office Relocation Update\n\nDear colleagues,\n\nAs previously announced, our company will be relocating to the new Riverside Tower on March 1. The moving company has been __(131)__ to handle the transfer of all office furniture and equipment.\n\nPlease pack your personal belongings in the boxes that will be __(132)__ to each workstation by February 25. Label each box clearly with your name and new office number.\n\nWe understand that the move may cause some __(133)__, but we are confident the new space will provide a much better working environment. The new building features modern meeting rooms, a rooftop terrace, and improved parking facilities.\n\n__(134)__. If you have any questions, please contact the Facilities Help Desk at extension 2200.\n\nBest regards,\nFacilities Management",
    stem: "Choose the best option for blank (133).",
    options: [
      { label: "A", text: "inconvenient" },
      { label: "B", text: "inconvenience" },
      { label: "C", text: "inconveniently" },
      { label: "D", text: "inconveniences" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q134",
    partId: "part-6",
    questionNumber: 134,
    passageGroupId: "part6-group-1",
    passage: "To: All Staff\nFrom: Facilities Management\nSubject: Office Relocation Update\n\nDear colleagues,\n\nAs previously announced, our company will be relocating to the new Riverside Tower on March 1. The moving company has been __(131)__ to handle the transfer of all office furniture and equipment.\n\nPlease pack your personal belongings in the boxes that will be __(132)__ to each workstation by February 25. Label each box clearly with your name and new office number.\n\nWe understand that the move may cause some __(133)__, but we are confident the new space will provide a much better working environment. The new building features modern meeting rooms, a rooftop terrace, and improved parking facilities.\n\n__(134)__. If you have any questions, please contact the Facilities Help Desk at extension 2200.\n\nBest regards,\nFacilities Management",
    stem: "Choose the best sentence for blank (134).",
    options: [
      { label: "A", text: "A detailed floor plan will be emailed to everyone by the end of this week" },
      { label: "B", text: "The previous office was built in 1995" },
      { label: "C", text: "Please remember to recycle all used materials" },
      { label: "D", text: "The company was founded over fifty years ago" }
    ],
    correctAnswer: "A"
  },

  // Group 2 (Q135-138) — Product announcement
  {
    id: "lr-2022-1-q135",
    partId: "part-6",
    questionNumber: 135,
    passageGroupId: "part6-group-2",
    passage: "Pinnacle Electronics is proud to introduce the AirStream X1, our latest wireless speaker designed for both home and office use. The X1 features __(135)__ sound quality with deep bass and crystal-clear highs.\n\nThe speaker connects __(136)__ via Bluetooth 5.0, allowing users to pair up to three devices simultaneously. With a battery life of up to eighteen hours, it is ideal for all-day use.\n\nThe AirStream X1 is now available in four colors: midnight black, silver, navy blue, and forest green. __(137)__ who pre-order before October 15 will receive a complimentary carrying case.\n\n__(138)__. Visit our website at pinnacleelectronics.com for more details.",
    stem: "Choose the best option for blank (135).",
    options: [
      { label: "A", text: "superb" },
      { label: "B", text: "superbly" },
      { label: "C", text: "superbing" },
      { label: "D", text: "superbed" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q136",
    partId: "part-6",
    questionNumber: 136,
    passageGroupId: "part6-group-2",
    passage: "Pinnacle Electronics is proud to introduce the AirStream X1, our latest wireless speaker designed for both home and office use. The X1 features __(135)__ sound quality with deep bass and crystal-clear highs.\n\nThe speaker connects __(136)__ via Bluetooth 5.0, allowing users to pair up to three devices simultaneously. With a battery life of up to eighteen hours, it is ideal for all-day use.\n\nThe AirStream X1 is now available in four colors: midnight black, silver, navy blue, and forest green. __(137)__ who pre-order before October 15 will receive a complimentary carrying case.\n\n__(138)__. Visit our website at pinnacleelectronics.com for more details.",
    stem: "Choose the best option for blank (136).",
    options: [
      { label: "A", text: "wirelessly" },
      { label: "B", text: "wireless" },
      { label: "C", text: "wiring" },
      { label: "D", text: "wired" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q137",
    partId: "part-6",
    questionNumber: 137,
    passageGroupId: "part6-group-2",
    passage: "Pinnacle Electronics is proud to introduce the AirStream X1, our latest wireless speaker designed for both home and office use. The X1 features __(135)__ sound quality with deep bass and crystal-clear highs.\n\nThe speaker connects __(136)__ via Bluetooth 5.0, allowing users to pair up to three devices simultaneously. With a battery life of up to eighteen hours, it is ideal for all-day use.\n\nThe AirStream X1 is now available in four colors: midnight black, silver, navy blue, and forest green. __(137)__ who pre-order before October 15 will receive a complimentary carrying case.\n\n__(138)__. Visit our website at pinnacleelectronics.com for more details.",
    stem: "Choose the best option for blank (137).",
    options: [
      { label: "A", text: "Customers" },
      { label: "B", text: "Employers" },
      { label: "C", text: "Suppliers" },
      { label: "D", text: "Investors" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q138",
    partId: "part-6",
    questionNumber: 138,
    passageGroupId: "part6-group-2",
    passage: "Pinnacle Electronics is proud to introduce the AirStream X1, our latest wireless speaker designed for both home and office use. The X1 features __(135)__ sound quality with deep bass and crystal-clear highs.\n\nThe speaker connects __(136)__ via Bluetooth 5.0, allowing users to pair up to three devices simultaneously. With a battery life of up to eighteen hours, it is ideal for all-day use.\n\nThe AirStream X1 is now available in four colors: midnight black, silver, navy blue, and forest green. __(137)__ who pre-order before October 15 will receive a complimentary carrying case.\n\n__(138)__. Visit our website at pinnacleelectronics.com for more details.",
    stem: "Choose the best sentence for blank (138).",
    options: [
      { label: "A", text: "Retail pricing starts at seventy-nine dollars" },
      { label: "B", text: "Our company was established in 2003" },
      { label: "C", text: "The previous model has been discontinued" },
      { label: "D", text: "Customer reviews have been mixed" }
    ],
    correctAnswer: "A"
  },

  // Group 3 (Q139-142) — Job posting notice
  {
    id: "lr-2022-1-q139",
    partId: "part-6",
    questionNumber: 139,
    passageGroupId: "part6-group-3",
    passage: "CRESTVIEW FINANCIAL SERVICES\nPosition: Senior Financial Analyst\nLocation: Chicago, IL\n\nCrestview Financial Services is seeking a highly __(139)__ Senior Financial Analyst to join our growing team. The ideal candidate will have a minimum of five years of experience in financial analysis or a related field.\n\nResponsibilities include preparing financial reports, __(140)__ budget forecasts, and advising senior management on investment strategies.\n\nWe offer a competitive salary, comprehensive health benefits, and generous paid time off. __(141)__, employees have access to professional development programs and tuition reimbursement.\n\n__(142)__. Please submit your resume and cover letter through our careers portal by November 30.",
    stem: "Choose the best option for blank (139).",
    options: [
      { label: "A", text: "motivate" },
      { label: "B", text: "motivated" },
      { label: "C", text: "motivating" },
      { label: "D", text: "motivation" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q140",
    partId: "part-6",
    questionNumber: 140,
    passageGroupId: "part6-group-3",
    passage: "CRESTVIEW FINANCIAL SERVICES\nPosition: Senior Financial Analyst\nLocation: Chicago, IL\n\nCrestview Financial Services is seeking a highly __(139)__ Senior Financial Analyst to join our growing team. The ideal candidate will have a minimum of five years of experience in financial analysis or a related field.\n\nResponsibilities include preparing financial reports, __(140)__ budget forecasts, and advising senior management on investment strategies.\n\nWe offer a competitive salary, comprehensive health benefits, and generous paid time off. __(141)__, employees have access to professional development programs and tuition reimbursement.\n\n__(142)__. Please submit your resume and cover letter through our careers portal by November 30.",
    stem: "Choose the best option for blank (140).",
    options: [
      { label: "A", text: "developing" },
      { label: "B", text: "developed" },
      { label: "C", text: "development" },
      { label: "D", text: "develop" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q141",
    partId: "part-6",
    questionNumber: 141,
    passageGroupId: "part6-group-3",
    passage: "CRESTVIEW FINANCIAL SERVICES\nPosition: Senior Financial Analyst\nLocation: Chicago, IL\n\nCrestview Financial Services is seeking a highly __(139)__ Senior Financial Analyst to join our growing team. The ideal candidate will have a minimum of five years of experience in financial analysis or a related field.\n\nResponsibilities include preparing financial reports, __(140)__ budget forecasts, and advising senior management on investment strategies.\n\nWe offer a competitive salary, comprehensive health benefits, and generous paid time off. __(141)__, employees have access to professional development programs and tuition reimbursement.\n\n__(142)__. Please submit your resume and cover letter through our careers portal by November 30.",
    stem: "Choose the best option for blank (141).",
    options: [
      { label: "A", text: "Additionally" },
      { label: "B", text: "However" },
      { label: "C", text: "Otherwise" },
      { label: "D", text: "Nevertheless" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q142",
    partId: "part-6",
    questionNumber: 142,
    passageGroupId: "part6-group-3",
    passage: "CRESTVIEW FINANCIAL SERVICES\nPosition: Senior Financial Analyst\nLocation: Chicago, IL\n\nCrestview Financial Services is seeking a highly __(139)__ Senior Financial Analyst to join our growing team. The ideal candidate will have a minimum of five years of experience in financial analysis or a related field.\n\nResponsibilities include preparing financial reports, __(140)__ budget forecasts, and advising senior management on investment strategies.\n\nWe offer a competitive salary, comprehensive health benefits, and generous paid time off. __(141)__, employees have access to professional development programs and tuition reimbursement.\n\n__(142)__. Please submit your resume and cover letter through our careers portal by November 30.",
    stem: "Choose the best sentence for blank (142).",
    options: [
      { label: "A", text: "Qualified candidates are encouraged to apply" },
      { label: "B", text: "The office building was recently renovated" },
      { label: "C", text: "Our company picnic is held every summer" },
      { label: "D", text: "Financial markets have been volatile recently" }
    ],
    correctAnswer: "A"
  },

  // Group 4 (Q143-146) — Gym membership notice
  {
    id: "lr-2022-1-q143",
    partId: "part-6",
    questionNumber: 143,
    passageGroupId: "part6-group-4",
    passage: "Dear Valued Members,\n\nWe are pleased to announce several upgrades to the Summit Fitness Center. Starting next month, we will be __(143)__ our facility to include a new indoor swimming pool and an expanded weight training area.\n\nDuring the construction period, __(144)__ to the locker rooms on the east side of the building will be temporarily restricted. We apologize for any inconvenience and __(145)__ that all other areas of the gym will remain fully operational.\n\n__(146)__. We look forward to providing you with an even better fitness experience.\n\nSincerely,\nSummit Fitness Center Management",
    stem: "Choose the best option for blank (143).",
    options: [
      { label: "A", text: "expanding" },
      { label: "B", text: "expanded" },
      { label: "C", text: "expansion" },
      { label: "D", text: "expands" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q144",
    partId: "part-6",
    questionNumber: 144,
    passageGroupId: "part6-group-4",
    passage: "Dear Valued Members,\n\nWe are pleased to announce several upgrades to the Summit Fitness Center. Starting next month, we will be __(143)__ our facility to include a new indoor swimming pool and an expanded weight training area.\n\nDuring the construction period, __(144)__ to the locker rooms on the east side of the building will be temporarily restricted. We apologize for any inconvenience and __(145)__ that all other areas of the gym will remain fully operational.\n\n__(146)__. We look forward to providing you with an even better fitness experience.\n\nSincerely,\nSummit Fitness Center Management",
    stem: "Choose the best option for blank (144).",
    options: [
      { label: "A", text: "access" },
      { label: "B", text: "accessible" },
      { label: "C", text: "accessing" },
      { label: "D", text: "accessed" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q145",
    partId: "part-6",
    questionNumber: 145,
    passageGroupId: "part6-group-4",
    passage: "Dear Valued Members,\n\nWe are pleased to announce several upgrades to the Summit Fitness Center. Starting next month, we will be __(143)__ our facility to include a new indoor swimming pool and an expanded weight training area.\n\nDuring the construction period, __(144)__ to the locker rooms on the east side of the building will be temporarily restricted. We apologize for any inconvenience and __(145)__ that all other areas of the gym will remain fully operational.\n\n__(146)__. We look forward to providing you with an even better fitness experience.\n\nSincerely,\nSummit Fitness Center Management",
    stem: "Choose the best option for blank (145).",
    options: [
      { label: "A", text: "assure" },
      { label: "B", text: "assurance" },
      { label: "C", text: "assured" },
      { label: "D", text: "assuring" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q146",
    partId: "part-6",
    questionNumber: 146,
    passageGroupId: "part6-group-4",
    passage: "Dear Valued Members,\n\nWe are pleased to announce several upgrades to the Summit Fitness Center. Starting next month, we will be __(143)__ our facility to include a new indoor swimming pool and an expanded weight training area.\n\nDuring the construction period, __(144)__ to the locker rooms on the east side of the building will be temporarily restricted. We apologize for any inconvenience and __(145)__ that all other areas of the gym will remain fully operational.\n\n__(146)__. We look forward to providing you with an even better fitness experience.\n\nSincerely,\nSummit Fitness Center Management",
    stem: "Choose the best sentence for blank (146).",
    options: [
      { label: "A", text: "The renovations are expected to be completed by the end of April" },
      { label: "B", text: "Our membership fees have remained unchanged since 2019" },
      { label: "C", text: "Swimming lessons are available for children under twelve" },
      { label: "D", text: "The original building was constructed in 1998" }
    ],
    correctAnswer: "A"
  }
];

// ---------------------------------------------------------------------------
// Part 7 — Reading Comprehension (Q147-200) — 15+ groups, 54 questions
// ---------------------------------------------------------------------------

const part7Questions: ToeicQuestion[] = [
  // Group 1 (Q147-148) — Short notice — 2 questions
  {
    id: "lr-2022-1-q147",
    partId: "part-7",
    questionNumber: 147,
    passageGroupId: "part7-group-1",
    passage: "NOTICE\n\nThe employee parking garage on Level B2 will be closed for resurfacing from Monday, April 3, through Friday, April 7. During this period, employees may park in the visitor lot on Oak Street at no charge. Please display your employee ID badge on your dashboard. Regular parking will resume on Monday, April 10.",
    stem: "Why will the parking garage be closed?",
    options: [
      { label: "A", text: "For a security upgrade" },
      { label: "B", text: "For resurfacing work" },
      { label: "C", text: "For an expansion project" },
      { label: "D", text: "For an inspection" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q148",
    partId: "part-7",
    questionNumber: 148,
    passageGroupId: "part7-group-1",
    passage: "NOTICE\n\nThe employee parking garage on Level B2 will be closed for resurfacing from Monday, April 3, through Friday, April 7. During this period, employees may park in the visitor lot on Oak Street at no charge. Please display your employee ID badge on your dashboard. Regular parking will resume on Monday, April 10.",
    stem: "What should employees display on their dashboard?",
    options: [
      { label: "A", text: "A parking permit" },
      { label: "B", text: "A visitor pass" },
      { label: "C", text: "An employee ID badge" },
      { label: "D", text: "A company sticker" }
    ],
    correctAnswer: "C"
  },

  // Group 2 (Q149-150) — Advertisement — 2 questions
  {
    id: "lr-2022-1-q149",
    partId: "part-7",
    questionNumber: 149,
    passageGroupId: "part7-group-2",
    passage: "CLEARWATER OFFICE FURNITURE\nEnd-of-Season Sale — Up to 40% Off!\n\nClearwater Office Furniture is offering huge discounts on desks, chairs, and storage units. Whether you're furnishing a home office or outfitting a corporate space, we have options for every budget.\n\n• Executive desks starting at $299\n• Ergonomic chairs from $149\n• Filing cabinets as low as $79\n\nSale runs from August 15 through September 5. Free delivery on orders over $500. Visit our showroom at 450 Commerce Drive or shop online at clearwaterfurniture.com.",
    stem: "What is being advertised?",
    options: [
      { label: "A", text: "A furniture sale" },
      { label: "B", text: "An office cleaning service" },
      { label: "C", text: "A moving company" },
      { label: "D", text: "An interior design course" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q150",
    partId: "part-7",
    questionNumber: 150,
    passageGroupId: "part7-group-2",
    passage: "CLEARWATER OFFICE FURNITURE\nEnd-of-Season Sale — Up to 40% Off!\n\nClearwater Office Furniture is offering huge discounts on desks, chairs, and storage units. Whether you're furnishing a home office or outfitting a corporate space, we have options for every budget.\n\n• Executive desks starting at $299\n• Ergonomic chairs from $149\n• Filing cabinets as low as $79\n\nSale runs from August 15 through September 5. Free delivery on orders over $500. Visit our showroom at 450 Commerce Drive or shop online at clearwaterfurniture.com.",
    stem: "What is the minimum order amount for free delivery?",
    options: [
      { label: "A", text: "$200" },
      { label: "B", text: "$300" },
      { label: "C", text: "$500" },
      { label: "D", text: "$750" }
    ],
    correctAnswer: "C"
  },

  // Group 3 (Q151-153) — Email — 3 questions
  {
    id: "lr-2022-1-q151",
    partId: "part-7",
    questionNumber: 151,
    passageGroupId: "part7-group-3",
    passage: "From: Laura Chen <laura.chen@meridiantech.com>\nTo: All Department Heads\nDate: September 8\nSubject: Q4 Budget Review Meeting\n\nDear Department Heads,\n\nPlease be advised that the Q4 budget review meeting will be held on Thursday, September 22, from 2:00 P.M. to 4:00 P.M. in Conference Room A on the 12th floor.\n\nEach department should prepare a summary of Q3 expenditures and projected Q4 needs. Please submit your reports to me by September 19 so I can compile the agenda.\n\nIf you are unable to attend, please designate a representative who can speak on behalf of your department.\n\nThank you,\nLaura Chen\nVP of Finance",
    stem: "What is the purpose of the email?",
    options: [
      { label: "A", text: "To announce a company merger" },
      { label: "B", text: "To schedule a budget review meeting" },
      { label: "C", text: "To request approval for a new project" },
      { label: "D", text: "To share quarterly sales results" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q152",
    partId: "part-7",
    questionNumber: 152,
    passageGroupId: "part7-group-3",
    passage: "From: Laura Chen <laura.chen@meridiantech.com>\nTo: All Department Heads\nDate: September 8\nSubject: Q4 Budget Review Meeting\n\nDear Department Heads,\n\nPlease be advised that the Q4 budget review meeting will be held on Thursday, September 22, from 2:00 P.M. to 4:00 P.M. in Conference Room A on the 12th floor.\n\nEach department should prepare a summary of Q3 expenditures and projected Q4 needs. Please submit your reports to me by September 19 so I can compile the agenda.\n\nIf you are unable to attend, please designate a representative who can speak on behalf of your department.\n\nThank you,\nLaura Chen\nVP of Finance",
    stem: "By when must reports be submitted?",
    options: [
      { label: "A", text: "September 8" },
      { label: "B", text: "September 15" },
      { label: "C", text: "September 19" },
      { label: "D", text: "September 22" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q153",
    partId: "part-7",
    questionNumber: 153,
    passageGroupId: "part7-group-3",
    passage: "From: Laura Chen <laura.chen@meridiantech.com>\nTo: All Department Heads\nDate: September 8\nSubject: Q4 Budget Review Meeting\n\nDear Department Heads,\n\nPlease be advised that the Q4 budget review meeting will be held on Thursday, September 22, from 2:00 P.M. to 4:00 P.M. in Conference Room A on the 12th floor.\n\nEach department should prepare a summary of Q3 expenditures and projected Q4 needs. Please submit your reports to me by September 19 so I can compile the agenda.\n\nIf you are unable to attend, please designate a representative who can speak on behalf of your department.\n\nThank you,\nLaura Chen\nVP of Finance",
    stem: "What should department heads do if they cannot attend?",
    options: [
      { label: "A", text: "Cancel their participation" },
      { label: "B", text: "Reschedule the meeting" },
      { label: "C", text: "Send their report by email" },
      { label: "D", text: "Designate a representative" }
    ],
    correctAnswer: "D"
  },

  // Group 4 (Q154-157) — Article — 4 questions
  {
    id: "lr-2022-1-q154",
    partId: "part-7",
    questionNumber: 154,
    passageGroupId: "part7-group-4",
    passage: "WESTFIELD DAILY NEWS\nNew Transit Line to Connect Downtown and Airport\n\nThe city of Westfield has approved a $2.3 billion project to build a new light rail line connecting the downtown business district to Westfield International Airport. Construction is scheduled to begin in early 2024 and is expected to be completed by 2027.\n\nThe new line will include twelve stations and is projected to serve approximately 85,000 passengers daily. City officials say the project will reduce traffic congestion on the highway connecting the two areas and create an estimated 4,000 construction jobs.\n\n\"This is a transformative investment in our city's infrastructure,\" said Mayor Diana Frost. \"It will make Westfield more accessible and attractive to businesses and visitors alike.\"\n\nThe project will be funded through a combination of federal grants, state funding, and municipal bonds.",
    stem: "What is the article mainly about?",
    options: [
      { label: "A", text: "A new airport terminal" },
      { label: "B", text: "A light rail construction project" },
      { label: "C", text: "A highway expansion plan" },
      { label: "D", text: "A budget deficit in Westfield" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q155",
    partId: "part-7",
    questionNumber: 155,
    passageGroupId: "part7-group-4",
    passage: "WESTFIELD DAILY NEWS\nNew Transit Line to Connect Downtown and Airport\n\nThe city of Westfield has approved a $2.3 billion project to build a new light rail line connecting the downtown business district to Westfield International Airport. Construction is scheduled to begin in early 2024 and is expected to be completed by 2027.\n\nThe new line will include twelve stations and is projected to serve approximately 85,000 passengers daily. City officials say the project will reduce traffic congestion on the highway connecting the two areas and create an estimated 4,000 construction jobs.\n\n\"This is a transformative investment in our city's infrastructure,\" said Mayor Diana Frost. \"It will make Westfield more accessible and attractive to businesses and visitors alike.\"\n\nThe project will be funded through a combination of federal grants, state funding, and municipal bonds.",
    stem: "How many stations will the new line have?",
    options: [
      { label: "A", text: "Eight" },
      { label: "B", text: "Ten" },
      { label: "C", text: "Twelve" },
      { label: "D", text: "Fifteen" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q156",
    partId: "part-7",
    questionNumber: 156,
    passageGroupId: "part7-group-4",
    passage: "WESTFIELD DAILY NEWS\nNew Transit Line to Connect Downtown and Airport\n\nThe city of Westfield has approved a $2.3 billion project to build a new light rail line connecting the downtown business district to Westfield International Airport. Construction is scheduled to begin in early 2024 and is expected to be completed by 2027.\n\nThe new line will include twelve stations and is projected to serve approximately 85,000 passengers daily. City officials say the project will reduce traffic congestion on the highway connecting the two areas and create an estimated 4,000 construction jobs.\n\n\"This is a transformative investment in our city's infrastructure,\" said Mayor Diana Frost. \"It will make Westfield more accessible and attractive to businesses and visitors alike.\"\n\nThe project will be funded through a combination of federal grants, state funding, and municipal bonds.",
    stem: "According to the article, what benefit will the project provide?",
    options: [
      { label: "A", text: "Lower airline ticket prices" },
      { label: "B", text: "Reduced traffic congestion" },
      { label: "C", text: "Free public transportation" },
      { label: "D", text: "New residential housing" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q157",
    partId: "part-7",
    questionNumber: 157,
    passageGroupId: "part7-group-4",
    passage: "WESTFIELD DAILY NEWS\nNew Transit Line to Connect Downtown and Airport\n\nThe city of Westfield has approved a $2.3 billion project to build a new light rail line connecting the downtown business district to Westfield International Airport. Construction is scheduled to begin in early 2024 and is expected to be completed by 2027.\n\nThe new line will include twelve stations and is projected to serve approximately 85,000 passengers daily. City officials say the project will reduce traffic congestion on the highway connecting the two areas and create an estimated 4,000 construction jobs.\n\n\"This is a transformative investment in our city's infrastructure,\" said Mayor Diana Frost. \"It will make Westfield more accessible and attractive to businesses and visitors alike.\"\n\nThe project will be funded through a combination of federal grants, state funding, and municipal bonds.",
    stem: "How will the project be funded?",
    options: [
      { label: "A", text: "Entirely by the federal government" },
      { label: "B", text: "Through private donations" },
      { label: "C", text: "By increasing property taxes" },
      { label: "D", text: "Through federal grants, state funding, and bonds" }
    ],
    correctAnswer: "D"
  },

  // Group 5 (Q158-160) — Memo — 3 questions
  {
    id: "lr-2022-1-q158",
    partId: "part-7",
    questionNumber: 158,
    passageGroupId: "part7-group-5",
    passage: "MEMO\nTo: All Sales Representatives\nFrom: Regional Sales Manager\nDate: July 15\nRe: Updated Commission Structure\n\nEffective August 1, the company will implement a revised commission structure. Sales representatives who meet 100% of their quarterly target will receive a 10% commission on all sales. Those who exceed their target by 20% or more will qualify for a 15% commission rate.\n\nPlease note that returns and cancellations within 30 days of purchase will be deducted from your total sales figure. Updated targets for Q3 will be distributed to each representative individually by July 25.\n\nFor questions, please contact your team lead.",
    stem: "What is the memo about?",
    options: [
      { label: "A", text: "A new product launch" },
      { label: "B", text: "Changes to the commission structure" },
      { label: "C", text: "Quarterly sales results" },
      { label: "D", text: "A company reorganization" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q159",
    partId: "part-7",
    questionNumber: 159,
    passageGroupId: "part7-group-5",
    passage: "MEMO\nTo: All Sales Representatives\nFrom: Regional Sales Manager\nDate: July 15\nRe: Updated Commission Structure\n\nEffective August 1, the company will implement a revised commission structure. Sales representatives who meet 100% of their quarterly target will receive a 10% commission on all sales. Those who exceed their target by 20% or more will qualify for a 15% commission rate.\n\nPlease note that returns and cancellations within 30 days of purchase will be deducted from your total sales figure. Updated targets for Q3 will be distributed to each representative individually by July 25.\n\nFor questions, please contact your team lead.",
    stem: "What commission rate applies to those who exceed their target by 20%?",
    options: [
      { label: "A", text: "5%" },
      { label: "B", text: "10%" },
      { label: "C", text: "15%" },
      { label: "D", text: "20%" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q160",
    partId: "part-7",
    questionNumber: 160,
    passageGroupId: "part7-group-5",
    passage: "MEMO\nTo: All Sales Representatives\nFrom: Regional Sales Manager\nDate: July 15\nRe: Updated Commission Structure\n\nEffective August 1, the company will implement a revised commission structure. Sales representatives who meet 100% of their quarterly target will receive a 10% commission on all sales. Those who exceed their target by 20% or more will qualify for a 15% commission rate.\n\nPlease note that returns and cancellations within 30 days of purchase will be deducted from your total sales figure. Updated targets for Q3 will be distributed to each representative individually by July 25.\n\nFor questions, please contact your team lead.",
    stem: "What will be deducted from total sales?",
    options: [
      { label: "A", text: "Shipping costs" },
      { label: "B", text: "Taxes and fees" },
      { label: "C", text: "Returns and cancellations" },
      { label: "D", text: "Marketing expenses" }
    ],
    correctAnswer: "C"
  },

  // Group 6 (Q161-164) — Double passage: email + schedule — 4 questions
  {
    id: "lr-2022-1-q161",
    partId: "part-7",
    questionNumber: 161,
    passageGroupId: "part7-group-6",
    passage: "--- Passage 1 ---\nFrom: Tom Wheeler <t.wheeler@globalevents.com>\nTo: Sarah Lim <s.lim@techvision.com>\nDate: October 2\nSubject: Annual Tech Summit — Speaker Confirmation\n\nDear Ms. Lim,\n\nThank you for agreeing to speak at the Annual Tech Summit on October 28. You are scheduled for the afternoon panel titled \"The Future of Cloud Computing.\" The panel discussion will run from 2:00 P.M. to 3:30 P.M. in Hall B.\n\nPlease arrive at the venue by 12:30 P.M. for a brief sound check and to meet the other panelists. Lunch will be provided in the speaker lounge on the second floor.\n\nI will send you the final program booklet by October 15.\n\nBest regards,\nTom Wheeler\nEvent Coordinator\n\n--- Passage 2 ---\nANNUAL TECH SUMMIT — OCTOBER 28\nProgram Schedule (Hall B)\n\n9:00 – 10:00 A.M.   Opening Keynote: \"Digital Transformation in 2023\" — Dr. Alan Foster\n10:15 – 11:45 A.M.  Panel: \"AI and the Modern Workplace\" — J. Patel, R. Simmons, K. Ono\n12:00 – 1:00 P.M.   Lunch Break\n1:15 – 1:45 P.M.    Lightning Talk: \"Cybersecurity Best Practices\" — N. Carter\n2:00 – 3:30 P.M.    Panel: \"The Future of Cloud Computing\" — S. Lim, M. Park, D. Novak\n3:45 – 4:30 P.M.    Closing Remarks and Networking",
    stem: "What is the purpose of Tom Wheeler's email?",
    options: [
      { label: "A", text: "To invite Ms. Lim to attend the summit" },
      { label: "B", text: "To confirm Ms. Lim's speaking schedule" },
      { label: "C", text: "To request a change in the program" },
      { label: "D", text: "To ask Ms. Lim to moderate a panel" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q162",
    partId: "part-7",
    questionNumber: 162,
    passageGroupId: "part7-group-6",
    passage: "--- Passage 1 ---\nFrom: Tom Wheeler <t.wheeler@globalevents.com>\nTo: Sarah Lim <s.lim@techvision.com>\nDate: October 2\nSubject: Annual Tech Summit — Speaker Confirmation\n\nDear Ms. Lim,\n\nThank you for agreeing to speak at the Annual Tech Summit on October 28. You are scheduled for the afternoon panel titled \"The Future of Cloud Computing.\" The panel discussion will run from 2:00 P.M. to 3:30 P.M. in Hall B.\n\nPlease arrive at the venue by 12:30 P.M. for a brief sound check and to meet the other panelists. Lunch will be provided in the speaker lounge on the second floor.\n\nI will send you the final program booklet by October 15.\n\nBest regards,\nTom Wheeler\nEvent Coordinator\n\n--- Passage 2 ---\nANNUAL TECH SUMMIT — OCTOBER 28\nProgram Schedule (Hall B)\n\n9:00 – 10:00 A.M.   Opening Keynote: \"Digital Transformation in 2023\" — Dr. Alan Foster\n10:15 – 11:45 A.M.  Panel: \"AI and the Modern Workplace\" — J. Patel, R. Simmons, K. Ono\n12:00 – 1:00 P.M.   Lunch Break\n1:15 – 1:45 P.M.    Lightning Talk: \"Cybersecurity Best Practices\" — N. Carter\n2:00 – 3:30 P.M.    Panel: \"The Future of Cloud Computing\" — S. Lim, M. Park, D. Novak\n3:45 – 4:30 P.M.    Closing Remarks and Networking",
    stem: "What time should Ms. Lim arrive at the venue?",
    options: [
      { label: "A", text: "9:00 A.M." },
      { label: "B", text: "12:00 P.M." },
      { label: "C", text: "12:30 P.M." },
      { label: "D", text: "2:00 P.M." }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q163",
    partId: "part-7",
    questionNumber: 163,
    passageGroupId: "part7-group-6",
    passage: "--- Passage 1 ---\nFrom: Tom Wheeler <t.wheeler@globalevents.com>\nTo: Sarah Lim <s.lim@techvision.com>\nDate: October 2\nSubject: Annual Tech Summit — Speaker Confirmation\n\nDear Ms. Lim,\n\nThank you for agreeing to speak at the Annual Tech Summit on October 28. You are scheduled for the afternoon panel titled \"The Future of Cloud Computing.\" The panel discussion will run from 2:00 P.M. to 3:30 P.M. in Hall B.\n\nPlease arrive at the venue by 12:30 P.M. for a brief sound check and to meet the other panelists. Lunch will be provided in the speaker lounge on the second floor.\n\nI will send you the final program booklet by October 15.\n\nBest regards,\nTom Wheeler\nEvent Coordinator\n\n--- Passage 2 ---\nANNUAL TECH SUMMIT — OCTOBER 28\nProgram Schedule (Hall B)\n\n9:00 – 10:00 A.M.   Opening Keynote: \"Digital Transformation in 2023\" — Dr. Alan Foster\n10:15 – 11:45 A.M.  Panel: \"AI and the Modern Workplace\" — J. Patel, R. Simmons, K. Ono\n12:00 – 1:00 P.M.   Lunch Break\n1:15 – 1:45 P.M.    Lightning Talk: \"Cybersecurity Best Practices\" — N. Carter\n2:00 – 3:30 P.M.    Panel: \"The Future of Cloud Computing\" — S. Lim, M. Park, D. Novak\n3:45 – 4:30 P.M.    Closing Remarks and Networking",
    stem: "Who is giving the opening keynote?",
    options: [
      { label: "A", text: "Sarah Lim" },
      { label: "B", text: "Tom Wheeler" },
      { label: "C", text: "Dr. Alan Foster" },
      { label: "D", text: "N. Carter" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q164",
    partId: "part-7",
    questionNumber: 164,
    passageGroupId: "part7-group-6",
    passage: "--- Passage 1 ---\nFrom: Tom Wheeler <t.wheeler@globalevents.com>\nTo: Sarah Lim <s.lim@techvision.com>\nDate: October 2\nSubject: Annual Tech Summit — Speaker Confirmation\n\nDear Ms. Lim,\n\nThank you for agreeing to speak at the Annual Tech Summit on October 28. You are scheduled for the afternoon panel titled \"The Future of Cloud Computing.\" The panel discussion will run from 2:00 P.M. to 3:30 P.M. in Hall B.\n\nPlease arrive at the venue by 12:30 P.M. for a brief sound check and to meet the other panelists. Lunch will be provided in the speaker lounge on the second floor.\n\nI will send you the final program booklet by October 15.\n\nBest regards,\nTom Wheeler\nEvent Coordinator\n\n--- Passage 2 ---\nANNUAL TECH SUMMIT — OCTOBER 28\nProgram Schedule (Hall B)\n\n9:00 – 10:00 A.M.   Opening Keynote: \"Digital Transformation in 2023\" — Dr. Alan Foster\n10:15 – 11:45 A.M.  Panel: \"AI and the Modern Workplace\" — J. Patel, R. Simmons, K. Ono\n12:00 – 1:00 P.M.   Lunch Break\n1:15 – 1:45 P.M.    Lightning Talk: \"Cybersecurity Best Practices\" — N. Carter\n2:00 – 3:30 P.M.    Panel: \"The Future of Cloud Computing\" — S. Lim, M. Park, D. Novak\n3:45 – 4:30 P.M.    Closing Remarks and Networking",
    stem: "According to the schedule, what happens after the cloud computing panel?",
    options: [
      { label: "A", text: "A cybersecurity talk" },
      { label: "B", text: "The lunch break" },
      { label: "C", text: "Another panel discussion" },
      { label: "D", text: "Closing remarks and networking" }
    ],
    correctAnswer: "D"
  },

  // Group 7 (Q165-168) — Form + instructions — 4 questions
  {
    id: "lr-2022-1-q165",
    partId: "part-7",
    questionNumber: 165,
    passageGroupId: "part7-group-7",
    passage: "HARBORVIEW HOTEL — GUEST FEEDBACK FORM\n\nName: Patricia Kwon\nRoom Number: 1214\nDates of Stay: June 5 – June 8\nPurpose of Visit: Business conference\n\nOverall Satisfaction: Very Satisfied\n\nComments:\nI had an excellent stay. The staff was incredibly helpful, especially when I needed a late checkout on my last day. The breakfast buffet had a great selection. My only suggestion would be to improve the Wi-Fi speed in the guest rooms — it was a bit slow during peak hours, which made it difficult to join a video conference. I would definitely recommend this hotel to colleagues.\n\nWould you stay with us again? Yes",
    stem: "What was the purpose of Ms. Kwon's visit?",
    options: [
      { label: "A", text: "A family vacation" },
      { label: "B", text: "A business conference" },
      { label: "C", text: "A wedding celebration" },
      { label: "D", text: "A sightseeing trip" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q166",
    partId: "part-7",
    questionNumber: 166,
    passageGroupId: "part7-group-7",
    passage: "HARBORVIEW HOTEL — GUEST FEEDBACK FORM\n\nName: Patricia Kwon\nRoom Number: 1214\nDates of Stay: June 5 – June 8\nPurpose of Visit: Business conference\n\nOverall Satisfaction: Very Satisfied\n\nComments:\nI had an excellent stay. The staff was incredibly helpful, especially when I needed a late checkout on my last day. The breakfast buffet had a great selection. My only suggestion would be to improve the Wi-Fi speed in the guest rooms — it was a bit slow during peak hours, which made it difficult to join a video conference. I would definitely recommend this hotel to colleagues.\n\nWould you stay with us again? Yes",
    stem: "What did Ms. Kwon praise about the hotel?",
    options: [
      { label: "A", text: "The room size" },
      { label: "B", text: "The pool facilities" },
      { label: "C", text: "The helpful staff" },
      { label: "D", text: "The parking garage" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q167",
    partId: "part-7",
    questionNumber: 167,
    passageGroupId: "part7-group-7",
    passage: "HARBORVIEW HOTEL — GUEST FEEDBACK FORM\n\nName: Patricia Kwon\nRoom Number: 1214\nDates of Stay: June 5 – June 8\nPurpose of Visit: Business conference\n\nOverall Satisfaction: Very Satisfied\n\nComments:\nI had an excellent stay. The staff was incredibly helpful, especially when I needed a late checkout on my last day. The breakfast buffet had a great selection. My only suggestion would be to improve the Wi-Fi speed in the guest rooms — it was a bit slow during peak hours, which made it difficult to join a video conference. I would definitely recommend this hotel to colleagues.\n\nWould you stay with us again? Yes",
    stem: "What issue did Ms. Kwon mention?",
    options: [
      { label: "A", text: "Noisy neighbors" },
      { label: "B", text: "Slow Wi-Fi speed" },
      { label: "C", text: "Limited breakfast options" },
      { label: "D", text: "Uncomfortable bedding" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q168",
    partId: "part-7",
    questionNumber: 168,
    passageGroupId: "part7-group-7",
    passage: "HARBORVIEW HOTEL — GUEST FEEDBACK FORM\n\nName: Patricia Kwon\nRoom Number: 1214\nDates of Stay: June 5 – June 8\nPurpose of Visit: Business conference\n\nOverall Satisfaction: Very Satisfied\n\nComments:\nI had an excellent stay. The staff was incredibly helpful, especially when I needed a late checkout on my last day. The breakfast buffet had a great selection. My only suggestion would be to improve the Wi-Fi speed in the guest rooms — it was a bit slow during peak hours, which made it difficult to join a video conference. I would definitely recommend this hotel to colleagues.\n\nWould you stay with us again? Yes",
    stem: "How many nights did Ms. Kwon stay?",
    options: [
      { label: "A", text: "Two nights" },
      { label: "B", text: "Three nights" },
      { label: "C", text: "Four nights" },
      { label: "D", text: "Five nights" }
    ],
    correctAnswer: "B"
  },

  // Group 8 (Q169-171) — Job advertisement — 3 questions
  {
    id: "lr-2022-1-q169",
    partId: "part-7",
    questionNumber: 169,
    passageGroupId: "part7-group-8",
    passage: "CEDAR GROVE PUBLISHING\nPosition: Marketing Coordinator\nDepartment: Marketing and Communications\nType: Full-time\nLocation: Portland, OR\n\nCedar Grove Publishing is looking for a Marketing Coordinator to support our promotional campaigns. The ideal candidate will assist with social media management, email marketing, and event coordination.\n\nRequirements:\n• Bachelor's degree in marketing or a related field\n• 2+ years of experience in marketing\n• Proficiency in Adobe Creative Suite and email marketing platforms\n• Strong written and verbal communication skills\n\nBenefits include health insurance, 401(k) matching, and four weeks of paid time off annually. Interested candidates should send a resume and portfolio to careers@cedargrove.com by August 31.",
    stem: "What position is being advertised?",
    options: [
      { label: "A", text: "Sales Manager" },
      { label: "B", text: "Marketing Coordinator" },
      { label: "C", text: "Graphic Designer" },
      { label: "D", text: "Editorial Assistant" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q170",
    partId: "part-7",
    questionNumber: 170,
    passageGroupId: "part7-group-8",
    passage: "CEDAR GROVE PUBLISHING\nPosition: Marketing Coordinator\nDepartment: Marketing and Communications\nType: Full-time\nLocation: Portland, OR\n\nCedar Grove Publishing is looking for a Marketing Coordinator to support our promotional campaigns. The ideal candidate will assist with social media management, email marketing, and event coordination.\n\nRequirements:\n• Bachelor's degree in marketing or a related field\n• 2+ years of experience in marketing\n• Proficiency in Adobe Creative Suite and email marketing platforms\n• Strong written and verbal communication skills\n\nBenefits include health insurance, 401(k) matching, and four weeks of paid time off annually. Interested candidates should send a resume and portfolio to careers@cedargrove.com by August 31.",
    stem: "What is a requirement for the position?",
    options: [
      { label: "A", text: "An MBA degree" },
      { label: "B", text: "Five years of experience" },
      { label: "C", text: "Proficiency in Adobe Creative Suite" },
      { label: "D", text: "Fluency in a second language" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q171",
    partId: "part-7",
    questionNumber: 171,
    passageGroupId: "part7-group-8",
    passage: "CEDAR GROVE PUBLISHING\nPosition: Marketing Coordinator\nDepartment: Marketing and Communications\nType: Full-time\nLocation: Portland, OR\n\nCedar Grove Publishing is looking for a Marketing Coordinator to support our promotional campaigns. The ideal candidate will assist with social media management, email marketing, and event coordination.\n\nRequirements:\n• Bachelor's degree in marketing or a related field\n• 2+ years of experience in marketing\n• Proficiency in Adobe Creative Suite and email marketing platforms\n• Strong written and verbal communication skills\n\nBenefits include health insurance, 401(k) matching, and four weeks of paid time off annually. Interested candidates should send a resume and portfolio to careers@cedargrove.com by August 31.",
    stem: "What should applicants submit?",
    options: [
      { label: "A", text: "A resume and portfolio" },
      { label: "B", text: "Three reference letters" },
      { label: "C", text: "Academic transcripts" },
      { label: "D", text: "A writing sample only" }
    ],
    correctAnswer: "A"
  },

  // Group 9 (Q172-175) — Double passage: product review + warranty — 4 questions
  {
    id: "lr-2022-1-q172",
    partId: "part-7",
    questionNumber: 172,
    passageGroupId: "part7-group-9",
    passage: "--- Passage 1: Online Review ---\nReviewed by: Kevin Marsh\nProduct: ProFit Standing Desk Model SD-450\nRating: ★★★★☆\n\nI purchased the SD-450 standing desk three months ago for my home office. Assembly was straightforward — it took about forty-five minutes. The electric height adjustment is smooth and quiet, and the desk surface is large enough for two monitors and a laptop.\n\nMy only complaint is that one of the cable management clips broke during assembly. I contacted customer service, and they shipped a replacement part within two days at no charge. Overall, I'm very satisfied with the product and the customer support.\n\n--- Passage 2: Warranty Information ---\nProFit Standing Desk — Warranty Policy\n\nAll ProFit standing desks come with a 5-year limited warranty covering defects in materials and workmanship. The electric motor is covered for 3 years. The warranty does not cover damage resulting from misuse, unauthorized modifications, or normal wear and tear.\n\nTo file a claim, contact our support team at support@profitdesks.com or call 1-800-555-0234. Please have your order number and proof of purchase ready.",
    stem: "What does Kevin Marsh like about the desk?",
    options: [
      { label: "A", text: "Its affordable price" },
      { label: "B", text: "Its compact size" },
      { label: "C", text: "Its smooth height adjustment" },
      { label: "D", text: "Its built-in speakers" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q173",
    partId: "part-7",
    questionNumber: 173,
    passageGroupId: "part7-group-9",
    passage: "--- Passage 1: Online Review ---\nReviewed by: Kevin Marsh\nProduct: ProFit Standing Desk Model SD-450\nRating: ★★★★☆\n\nI purchased the SD-450 standing desk three months ago for my home office. Assembly was straightforward — it took about forty-five minutes. The electric height adjustment is smooth and quiet, and the desk surface is large enough for two monitors and a laptop.\n\nMy only complaint is that one of the cable management clips broke during assembly. I contacted customer service, and they shipped a replacement part within two days at no charge. Overall, I'm very satisfied with the product and the customer support.\n\n--- Passage 2: Warranty Information ---\nProFit Standing Desk — Warranty Policy\n\nAll ProFit standing desks come with a 5-year limited warranty covering defects in materials and workmanship. The electric motor is covered for 3 years. The warranty does not cover damage resulting from misuse, unauthorized modifications, or normal wear and tear.\n\nTo file a claim, contact our support team at support@profitdesks.com or call 1-800-555-0234. Please have your order number and proof of purchase ready.",
    stem: "What problem did Kevin Marsh experience?",
    options: [
      { label: "A", text: "The motor stopped working." },
      { label: "B", text: "A cable management clip broke." },
      { label: "C", text: "The desk surface was scratched." },
      { label: "D", text: "The desk arrived late." }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q174",
    partId: "part-7",
    questionNumber: 174,
    passageGroupId: "part7-group-9",
    passage: "--- Passage 1: Online Review ---\nReviewed by: Kevin Marsh\nProduct: ProFit Standing Desk Model SD-450\nRating: ★★★★☆\n\nI purchased the SD-450 standing desk three months ago for my home office. Assembly was straightforward — it took about forty-five minutes. The electric height adjustment is smooth and quiet, and the desk surface is large enough for two monitors and a laptop.\n\nMy only complaint is that one of the cable management clips broke during assembly. I contacted customer service, and they shipped a replacement part within two days at no charge. Overall, I'm very satisfied with the product and the customer support.\n\n--- Passage 2: Warranty Information ---\nProFit Standing Desk — Warranty Policy\n\nAll ProFit standing desks come with a 5-year limited warranty covering defects in materials and workmanship. The electric motor is covered for 3 years. The warranty does not cover damage resulting from misuse, unauthorized modifications, or normal wear and tear.\n\nTo file a claim, contact our support team at support@profitdesks.com or call 1-800-555-0234. Please have your order number and proof of purchase ready.",
    stem: "How long is the warranty on the electric motor?",
    options: [
      { label: "A", text: "One year" },
      { label: "B", text: "Two years" },
      { label: "C", text: "Three years" },
      { label: "D", text: "Five years" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q175",
    partId: "part-7",
    questionNumber: 175,
    passageGroupId: "part7-group-9",
    passage: "--- Passage 1: Online Review ---\nReviewed by: Kevin Marsh\nProduct: ProFit Standing Desk Model SD-450\nRating: ★★★★☆\n\nI purchased the SD-450 standing desk three months ago for my home office. Assembly was straightforward — it took about forty-five minutes. The electric height adjustment is smooth and quiet, and the desk surface is large enough for two monitors and a laptop.\n\nMy only complaint is that one of the cable management clips broke during assembly. I contacted customer service, and they shipped a replacement part within two days at no charge. Overall, I'm very satisfied with the product and the customer support.\n\n--- Passage 2: Warranty Information ---\nProFit Standing Desk — Warranty Policy\n\nAll ProFit standing desks come with a 5-year limited warranty covering defects in materials and workmanship. The electric motor is covered for 3 years. The warranty does not cover damage resulting from misuse, unauthorized modifications, or normal wear and tear.\n\nTo file a claim, contact our support team at support@profitdesks.com or call 1-800-555-0234. Please have your order number and proof of purchase ready.",
    stem: "What is NOT covered by the warranty?",
    options: [
      { label: "A", text: "Defects in materials" },
      { label: "B", text: "Defects in workmanship" },
      { label: "C", text: "Damage from normal wear and tear" },
      { label: "D", text: "Electric motor failure" }
    ],
    correctAnswer: "C"
  },

  // Group 10 (Q176-179) — Newsletter article — 4 questions
  {
    id: "lr-2022-1-q176",
    partId: "part-7",
    questionNumber: 176,
    passageGroupId: "part7-group-10",
    passage: "BRIGHTPATH CONSULTING — EMPLOYEE NEWSLETTER\nVolume 14, Issue 3 — March\n\nEmployee of the Quarter: Congratulations to Maria Santos!\n\nWe are pleased to announce that Maria Santos from the Client Relations team has been named Employee of the Quarter. Maria joined BrightPath in 2019 and has consistently exceeded her performance targets. In Q4 alone, she managed relationships with 28 key accounts and helped secure three new enterprise clients, generating $1.2 million in new contracts.\n\n\"Maria's dedication and positive attitude are truly inspiring,\" said VP of Client Relations James Okoro. \"She always goes above and beyond to ensure our clients are satisfied.\"\n\nAs part of the recognition, Maria will receive a $500 bonus and two additional days of paid leave. Please join us in congratulating Maria at the all-hands meeting on March 15!",
    stem: "Why is Maria Santos being recognized?",
    options: [
      { label: "A", text: "She completed a training program." },
      { label: "B", text: "She was promoted to VP." },
      { label: "C", text: "She was named Employee of the Quarter." },
      { label: "D", text: "She organized the company retreat." }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q177",
    partId: "part-7",
    questionNumber: 177,
    passageGroupId: "part7-group-10",
    passage: "BRIGHTPATH CONSULTING — EMPLOYEE NEWSLETTER\nVolume 14, Issue 3 — March\n\nEmployee of the Quarter: Congratulations to Maria Santos!\n\nWe are pleased to announce that Maria Santos from the Client Relations team has been named Employee of the Quarter. Maria joined BrightPath in 2019 and has consistently exceeded her performance targets. In Q4 alone, she managed relationships with 28 key accounts and helped secure three new enterprise clients, generating $1.2 million in new contracts.\n\n\"Maria's dedication and positive attitude are truly inspiring,\" said VP of Client Relations James Okoro. \"She always goes above and beyond to ensure our clients are satisfied.\"\n\nAs part of the recognition, Maria will receive a $500 bonus and two additional days of paid leave. Please join us in congratulating Maria at the all-hands meeting on March 15!",
    stem: "How many new enterprise clients did Maria help secure?",
    options: [
      { label: "A", text: "One" },
      { label: "B", text: "Two" },
      { label: "C", text: "Three" },
      { label: "D", text: "Five" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q178",
    partId: "part-7",
    questionNumber: 178,
    passageGroupId: "part7-group-10",
    passage: "BRIGHTPATH CONSULTING — EMPLOYEE NEWSLETTER\nVolume 14, Issue 3 — March\n\nEmployee of the Quarter: Congratulations to Maria Santos!\n\nWe are pleased to announce that Maria Santos from the Client Relations team has been named Employee of the Quarter. Maria joined BrightPath in 2019 and has consistently exceeded her performance targets. In Q4 alone, she managed relationships with 28 key accounts and helped secure three new enterprise clients, generating $1.2 million in new contracts.\n\n\"Maria's dedication and positive attitude are truly inspiring,\" said VP of Client Relations James Okoro. \"She always goes above and beyond to ensure our clients are satisfied.\"\n\nAs part of the recognition, Maria will receive a $500 bonus and two additional days of paid leave. Please join us in congratulating Maria at the all-hands meeting on March 15!",
    stem: "What will Maria receive as part of the recognition?",
    options: [
      { label: "A", text: "A company car" },
      { label: "B", text: "A bonus and extra paid leave" },
      { label: "C", text: "A trip to a conference" },
      { label: "D", text: "A promotion to manager" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q179",
    partId: "part-7",
    questionNumber: 179,
    passageGroupId: "part7-group-10",
    passage: "BRIGHTPATH CONSULTING — EMPLOYEE NEWSLETTER\nVolume 14, Issue 3 — March\n\nEmployee of the Quarter: Congratulations to Maria Santos!\n\nWe are pleased to announce that Maria Santos from the Client Relations team has been named Employee of the Quarter. Maria joined BrightPath in 2019 and has consistently exceeded her performance targets. In Q4 alone, she managed relationships with 28 key accounts and helped secure three new enterprise clients, generating $1.2 million in new contracts.\n\n\"Maria's dedication and positive attitude are truly inspiring,\" said VP of Client Relations James Okoro. \"She always goes above and beyond to ensure our clients are satisfied.\"\n\nAs part of the recognition, Maria will receive a $500 bonus and two additional days of paid leave. Please join us in congratulating Maria at the all-hands meeting on March 15!",
    stem: "Who is James Okoro?",
    options: [
      { label: "A", text: "The CEO of BrightPath" },
      { label: "B", text: "Maria's direct client" },
      { label: "C", text: "The VP of Client Relations" },
      { label: "D", text: "A new enterprise client" }
    ],
    correctAnswer: "C"
  },

  // Group 11 (Q180-182) — Policy document — 3 questions
  {
    id: "lr-2022-1-q180",
    partId: "part-7",
    questionNumber: 180,
    passageGroupId: "part7-group-11",
    passage: "ATLAS LOGISTICS — RETURN AND REFUND POLICY\n\nAtlas Logistics offers a 30-day return policy for all products purchased through our website. Items must be returned in their original packaging and in unused condition. Customers are responsible for return shipping costs unless the item is defective or was shipped in error.\n\nRefunds will be processed within 5-7 business days after the returned item is received and inspected. The refund will be credited to the original payment method. Gift card purchases are non-refundable.\n\nFor exchanges, please contact our customer service team at returns@atlaslogistics.com or call 1-888-555-0176. Exchanges are subject to product availability.",
    stem: "How long do customers have to return a product?",
    options: [
      { label: "A", text: "14 days" },
      { label: "B", text: "30 days" },
      { label: "C", text: "60 days" },
      { label: "D", text: "90 days" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q181",
    partId: "part-7",
    questionNumber: 181,
    passageGroupId: "part7-group-11",
    passage: "ATLAS LOGISTICS — RETURN AND REFUND POLICY\n\nAtlas Logistics offers a 30-day return policy for all products purchased through our website. Items must be returned in their original packaging and in unused condition. Customers are responsible for return shipping costs unless the item is defective or was shipped in error.\n\nRefunds will be processed within 5-7 business days after the returned item is received and inspected. The refund will be credited to the original payment method. Gift card purchases are non-refundable.\n\nFor exchanges, please contact our customer service team at returns@atlaslogistics.com or call 1-888-555-0176. Exchanges are subject to product availability.",
    stem: "When is return shipping free?",
    options: [
      { label: "A", text: "When the item costs over $100" },
      { label: "B", text: "When the customer has a membership" },
      { label: "C", text: "When the item is defective or shipped in error" },
      { label: "D", text: "When the return is made within 7 days" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q182",
    partId: "part-7",
    questionNumber: 182,
    passageGroupId: "part7-group-11",
    passage: "ATLAS LOGISTICS — RETURN AND REFUND POLICY\n\nAtlas Logistics offers a 30-day return policy for all products purchased through our website. Items must be returned in their original packaging and in unused condition. Customers are responsible for return shipping costs unless the item is defective or was shipped in error.\n\nRefunds will be processed within 5-7 business days after the returned item is received and inspected. The refund will be credited to the original payment method. Gift card purchases are non-refundable.\n\nFor exchanges, please contact our customer service team at returns@atlaslogistics.com or call 1-888-555-0176. Exchanges are subject to product availability.",
    stem: "What cannot be refunded?",
    options: [
      { label: "A", text: "Clothing items" },
      { label: "B", text: "Electronics" },
      { label: "C", text: "Gift card purchases" },
      { label: "D", text: "Sale items" }
    ],
    correctAnswer: "C"
  },

  // Group 12 (Q183-186) — Double passage: invitation + reply — 4 questions
  {
    id: "lr-2022-1-q183",
    partId: "part-7",
    questionNumber: 183,
    passageGroupId: "part7-group-12",
    passage: "--- Passage 1: Invitation ---\nYou are cordially invited to the\nSILVERSTONE INDUSTRIES ANNUAL AWARDS GALA\n\nDate: Saturday, December 9\nTime: 6:30 P.M. — 10:00 P.M.\nVenue: Grand Ballroom, The Meridian Hotel\nDress Code: Business formal\n\nJoin us for an evening of celebration as we honor outstanding team members and reflect on a year of exceptional achievements. The evening will include a cocktail reception, a three-course dinner, and live entertainment.\n\nPlease RSVP by November 24 to events@silverstoneindustries.com. Each employee may bring one guest.\n\n--- Passage 2: Reply ---\nFrom: Rachel Kim <r.kim@silverstoneindustries.com>\nTo: events@silverstoneindustries.com\nDate: November 18\nSubject: Re: Awards Gala RSVP\n\nHi,\n\nI would like to confirm my attendance at the Annual Awards Gala on December 9. I will be bringing my husband as my guest.\n\nAlso, could you let me know if there are vegetarian menu options available? My husband has dietary restrictions.\n\nThank you,\nRachel Kim\nSenior Accountant",
    stem: "What is the dress code for the gala?",
    options: [
      { label: "A", text: "Casual" },
      { label: "B", text: "Smart casual" },
      { label: "C", text: "Business formal" },
      { label: "D", text: "Black tie" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q184",
    partId: "part-7",
    questionNumber: 184,
    passageGroupId: "part7-group-12",
    passage: "--- Passage 1: Invitation ---\nYou are cordially invited to the\nSILVERSTONE INDUSTRIES ANNUAL AWARDS GALA\n\nDate: Saturday, December 9\nTime: 6:30 P.M. — 10:00 P.M.\nVenue: Grand Ballroom, The Meridian Hotel\nDress Code: Business formal\n\nJoin us for an evening of celebration as we honor outstanding team members and reflect on a year of exceptional achievements. The evening will include a cocktail reception, a three-course dinner, and live entertainment.\n\nPlease RSVP by November 24 to events@silverstoneindustries.com. Each employee may bring one guest.\n\n--- Passage 2: Reply ---\nFrom: Rachel Kim <r.kim@silverstoneindustries.com>\nTo: events@silverstoneindustries.com\nDate: November 18\nSubject: Re: Awards Gala RSVP\n\nHi,\n\nI would like to confirm my attendance at the Annual Awards Gala on December 9. I will be bringing my husband as my guest.\n\nAlso, could you let me know if there are vegetarian menu options available? My husband has dietary restrictions.\n\nThank you,\nRachel Kim\nSenior Accountant",
    stem: "When is the RSVP deadline?",
    options: [
      { label: "A", text: "November 18" },
      { label: "B", text: "November 24" },
      { label: "C", text: "December 1" },
      { label: "D", text: "December 9" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q185",
    partId: "part-7",
    questionNumber: 185,
    passageGroupId: "part7-group-12",
    passage: "--- Passage 1: Invitation ---\nYou are cordially invited to the\nSILVERSTONE INDUSTRIES ANNUAL AWARDS GALA\n\nDate: Saturday, December 9\nTime: 6:30 P.M. — 10:00 P.M.\nVenue: Grand Ballroom, The Meridian Hotel\nDress Code: Business formal\n\nJoin us for an evening of celebration as we honor outstanding team members and reflect on a year of exceptional achievements. The evening will include a cocktail reception, a three-course dinner, and live entertainment.\n\nPlease RSVP by November 24 to events@silverstoneindustries.com. Each employee may bring one guest.\n\n--- Passage 2: Reply ---\nFrom: Rachel Kim <r.kim@silverstoneindustries.com>\nTo: events@silverstoneindustries.com\nDate: November 18\nSubject: Re: Awards Gala RSVP\n\nHi,\n\nI would like to confirm my attendance at the Annual Awards Gala on December 9. I will be bringing my husband as my guest.\n\nAlso, could you let me know if there are vegetarian menu options available? My husband has dietary restrictions.\n\nThank you,\nRachel Kim\nSenior Accountant",
    stem: "Who will Rachel Kim bring as her guest?",
    options: [
      { label: "A", text: "A colleague" },
      { label: "B", text: "Her husband" },
      { label: "C", text: "Her manager" },
      { label: "D", text: "A client" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q186",
    partId: "part-7",
    questionNumber: 186,
    passageGroupId: "part7-group-12",
    passage: "--- Passage 1: Invitation ---\nYou are cordially invited to the\nSILVERSTONE INDUSTRIES ANNUAL AWARDS GALA\n\nDate: Saturday, December 9\nTime: 6:30 P.M. — 10:00 P.M.\nVenue: Grand Ballroom, The Meridian Hotel\nDress Code: Business formal\n\nJoin us for an evening of celebration as we honor outstanding team members and reflect on a year of exceptional achievements. The evening will include a cocktail reception, a three-course dinner, and live entertainment.\n\nPlease RSVP by November 24 to events@silverstoneindustries.com. Each employee may bring one guest.\n\n--- Passage 2: Reply ---\nFrom: Rachel Kim <r.kim@silverstoneindustries.com>\nTo: events@silverstoneindustries.com\nDate: November 18\nSubject: Re: Awards Gala RSVP\n\nHi,\n\nI would like to confirm my attendance at the Annual Awards Gala on December 9. I will be bringing my husband as my guest.\n\nAlso, could you let me know if there are vegetarian menu options available? My husband has dietary restrictions.\n\nThank you,\nRachel Kim\nSenior Accountant",
    stem: "What does Rachel Kim ask about?",
    options: [
      { label: "A", text: "The event location" },
      { label: "B", text: "The parking situation" },
      { label: "C", text: "Vegetarian menu options" },
      { label: "D", text: "The entertainment program" }
    ],
    correctAnswer: "C"
  },

  // Group 13 (Q187-190) — Training schedule — 4 questions
  {
    id: "lr-2022-1-q187",
    partId: "part-7",
    questionNumber: 187,
    passageGroupId: "part7-group-13",
    passage: "NEXGEN SOLUTIONS — NEW EMPLOYEE TRAINING SCHEDULE\nWeek of January 15\n\nMonday, Jan. 15\n9:00 – 10:30 A.M. Company Overview and Culture (Room 201) — HR Department\n11:00 – 12:30 P.M. IT Systems and Security Protocols (Room 305) — IT Department\n\nTuesday, Jan. 16\n9:00 – 11:00 A.M. Product Knowledge Workshop (Room 201) — Product Team\n1:00 – 3:00 P.M. Customer Service Standards (Room 201) — Training Department\n\nWednesday, Jan. 17\n9:00 – 12:00 P.M. Departmental Orientation — Individual departments\n1:00 – 2:30 P.M. Benefits and Payroll Setup (Room 305) — HR Department\n\nThursday, Jan. 18\n9:00 – 11:00 A.M. Workplace Safety Training (Auditorium) — Safety Officer\n1:00 – 3:00 P.M. Mentor Meeting and Q&A — Assigned mentors\n\nNote: Lunch is provided daily from 12:30 to 1:00 P.M. in the employee cafeteria. Please bring a valid photo ID on your first day.",
    stem: "When is the IT Systems training?",
    options: [
      { label: "A", text: "Monday morning" },
      { label: "B", text: "Monday afternoon" },
      { label: "C", text: "Tuesday morning" },
      { label: "D", text: "Wednesday afternoon" }
    ],
    correctAnswer: "A"
  },
  {
    id: "lr-2022-1-q188",
    partId: "part-7",
    questionNumber: 188,
    passageGroupId: "part7-group-13",
    passage: "NEXGEN SOLUTIONS — NEW EMPLOYEE TRAINING SCHEDULE\nWeek of January 15\n\nMonday, Jan. 15\n9:00 – 10:30 A.M. Company Overview and Culture (Room 201) — HR Department\n11:00 – 12:30 P.M. IT Systems and Security Protocols (Room 305) — IT Department\n\nTuesday, Jan. 16\n9:00 – 11:00 A.M. Product Knowledge Workshop (Room 201) — Product Team\n1:00 – 3:00 P.M. Customer Service Standards (Room 201) — Training Department\n\nWednesday, Jan. 17\n9:00 – 12:00 P.M. Departmental Orientation — Individual departments\n1:00 – 2:30 P.M. Benefits and Payroll Setup (Room 305) — HR Department\n\nThursday, Jan. 18\n9:00 – 11:00 A.M. Workplace Safety Training (Auditorium) — Safety Officer\n1:00 – 3:00 P.M. Mentor Meeting and Q&A — Assigned mentors\n\nNote: Lunch is provided daily from 12:30 to 1:00 P.M. in the employee cafeteria. Please bring a valid photo ID on your first day.",
    stem: "Where does the Workplace Safety Training take place?",
    options: [
      { label: "A", text: "Room 201" },
      { label: "B", text: "Room 305" },
      { label: "C", text: "The auditorium" },
      { label: "D", text: "The cafeteria" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q189",
    partId: "part-7",
    questionNumber: 189,
    passageGroupId: "part7-group-13",
    passage: "NEXGEN SOLUTIONS — NEW EMPLOYEE TRAINING SCHEDULE\nWeek of January 15\n\nMonday, Jan. 15\n9:00 – 10:30 A.M. Company Overview and Culture (Room 201) — HR Department\n11:00 – 12:30 P.M. IT Systems and Security Protocols (Room 305) — IT Department\n\nTuesday, Jan. 16\n9:00 – 11:00 A.M. Product Knowledge Workshop (Room 201) — Product Team\n1:00 – 3:00 P.M. Customer Service Standards (Room 201) — Training Department\n\nWednesday, Jan. 17\n9:00 – 12:00 P.M. Departmental Orientation — Individual departments\n1:00 – 2:30 P.M. Benefits and Payroll Setup (Room 305) — HR Department\n\nThursday, Jan. 18\n9:00 – 11:00 A.M. Workplace Safety Training (Auditorium) — Safety Officer\n1:00 – 3:00 P.M. Mentor Meeting and Q&A — Assigned mentors\n\nNote: Lunch is provided daily from 12:30 to 1:00 P.M. in the employee cafeteria. Please bring a valid photo ID on your first day.",
    stem: "What should new employees bring on their first day?",
    options: [
      { label: "A", text: "A laptop computer" },
      { label: "B", text: "Business cards" },
      { label: "C", text: "A valid photo ID" },
      { label: "D", text: "A signed contract" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q190",
    partId: "part-7",
    questionNumber: 190,
    passageGroupId: "part7-group-13",
    passage: "NEXGEN SOLUTIONS — NEW EMPLOYEE TRAINING SCHEDULE\nWeek of January 15\n\nMonday, Jan. 15\n9:00 – 10:30 A.M. Company Overview and Culture (Room 201) — HR Department\n11:00 – 12:30 P.M. IT Systems and Security Protocols (Room 305) — IT Department\n\nTuesday, Jan. 16\n9:00 – 11:00 A.M. Product Knowledge Workshop (Room 201) — Product Team\n1:00 – 3:00 P.M. Customer Service Standards (Room 201) — Training Department\n\nWednesday, Jan. 17\n9:00 – 12:00 P.M. Departmental Orientation — Individual departments\n1:00 – 2:30 P.M. Benefits and Payroll Setup (Room 305) — HR Department\n\nThursday, Jan. 18\n9:00 – 11:00 A.M. Workplace Safety Training (Auditorium) — Safety Officer\n1:00 – 3:00 P.M. Mentor Meeting and Q&A — Assigned mentors\n\nNote: Lunch is provided daily from 12:30 to 1:00 P.M. in the employee cafeteria. Please bring a valid photo ID on your first day.",
    stem: "Who conducts the Customer Service Standards session?",
    options: [
      { label: "A", text: "The HR Department" },
      { label: "B", text: "The IT Department" },
      { label: "C", text: "The Training Department" },
      { label: "D", text: "The Product Team" }
    ],
    correctAnswer: "C"
  },

  // Group 14 (Q191-195) — Double passage: renovation notice + tenant letter — 5 questions
  {
    id: "lr-2022-1-q191",
    partId: "part-7",
    questionNumber: 191,
    passageGroupId: "part7-group-14",
    passage: "--- Passage 1: Building Notice ---\nNOTICE TO ALL TENANTS\nCENTRAL PLAZA OFFICE BUILDING\n\nPlease be informed that the lobby and main entrance of Central Plaza will undergo renovation starting Monday, February 5, through Friday, March 8. During this period, all tenants and visitors should use the south entrance on Elm Street.\n\nThe renovation will include new flooring, updated lighting, improved accessibility features, and a redesigned reception area. Elevator access from the south entrance will remain available at all times.\n\nWe appreciate your patience during this improvement period. For questions or concerns, contact Building Management at lobby@centralplaza.com.\n\n--- Passage 2: Tenant Response ---\nFrom: Daniel Ortiz <d.ortiz@brightlaw.com>\nTo: lobby@centralplaza.com\nDate: January 29\nSubject: Lobby Renovation — Client Access Concern\n\nDear Building Management,\n\nThank you for the advance notice about the lobby renovation. Our law firm, Bright & Associates, occupies the 8th floor and regularly receives clients throughout the day.\n\nI am concerned that the change in entrance may confuse our clients who are visiting for the first time. Would it be possible to place signage at the main entrance directing visitors to the south entrance? Additionally, could you provide us with a map we can email to clients ahead of their visits?\n\nThank you for your attention to this matter.\n\nDaniel Ortiz\nManaging Partner, Bright & Associates",
    stem: "Why will the main entrance be closed?",
    options: [
      { label: "A", text: "For a security investigation" },
      { label: "B", text: "For lobby renovation" },
      { label: "C", text: "For a fire drill" },
      { label: "D", text: "For a building inspection" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q192",
    partId: "part-7",
    questionNumber: 192,
    passageGroupId: "part7-group-14",
    passage: "--- Passage 1: Building Notice ---\nNOTICE TO ALL TENANTS\nCENTRAL PLAZA OFFICE BUILDING\n\nPlease be informed that the lobby and main entrance of Central Plaza will undergo renovation starting Monday, February 5, through Friday, March 8. During this period, all tenants and visitors should use the south entrance on Elm Street.\n\nThe renovation will include new flooring, updated lighting, improved accessibility features, and a redesigned reception area. Elevator access from the south entrance will remain available at all times.\n\nWe appreciate your patience during this improvement period. For questions or concerns, contact Building Management at lobby@centralplaza.com.\n\n--- Passage 2: Tenant Response ---\nFrom: Daniel Ortiz <d.ortiz@brightlaw.com>\nTo: lobby@centralplaza.com\nDate: January 29\nSubject: Lobby Renovation — Client Access Concern\n\nDear Building Management,\n\nThank you for the advance notice about the lobby renovation. Our law firm, Bright & Associates, occupies the 8th floor and regularly receives clients throughout the day.\n\nI am concerned that the change in entrance may confuse our clients who are visiting for the first time. Would it be possible to place signage at the main entrance directing visitors to the south entrance? Additionally, could you provide us with a map we can email to clients ahead of their visits?\n\nThank you for your attention to this matter.\n\nDaniel Ortiz\nManaging Partner, Bright & Associates",
    stem: "Which entrance should tenants use during the renovation?",
    options: [
      { label: "A", text: "The north entrance" },
      { label: "B", text: "The east entrance" },
      { label: "C", text: "The south entrance on Elm Street" },
      { label: "D", text: "The underground parking entrance" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q193",
    partId: "part-7",
    questionNumber: 193,
    passageGroupId: "part7-group-14",
    passage: "--- Passage 1: Building Notice ---\nNOTICE TO ALL TENANTS\nCENTRAL PLAZA OFFICE BUILDING\n\nPlease be informed that the lobby and main entrance of Central Plaza will undergo renovation starting Monday, February 5, through Friday, March 8. During this period, all tenants and visitors should use the south entrance on Elm Street.\n\nThe renovation will include new flooring, updated lighting, improved accessibility features, and a redesigned reception area. Elevator access from the south entrance will remain available at all times.\n\nWe appreciate your patience during this improvement period. For questions or concerns, contact Building Management at lobby@centralplaza.com.\n\n--- Passage 2: Tenant Response ---\nFrom: Daniel Ortiz <d.ortiz@brightlaw.com>\nTo: lobby@centralplaza.com\nDate: January 29\nSubject: Lobby Renovation — Client Access Concern\n\nDear Building Management,\n\nThank you for the advance notice about the lobby renovation. Our law firm, Bright & Associates, occupies the 8th floor and regularly receives clients throughout the day.\n\nI am concerned that the change in entrance may confuse our clients who are visiting for the first time. Would it be possible to place signage at the main entrance directing visitors to the south entrance? Additionally, could you provide us with a map we can email to clients ahead of their visits?\n\nThank you for your attention to this matter.\n\nDaniel Ortiz\nManaging Partner, Bright & Associates",
    stem: "What type of business does Daniel Ortiz operate?",
    options: [
      { label: "A", text: "An accounting firm" },
      { label: "B", text: "A law firm" },
      { label: "C", text: "A consulting agency" },
      { label: "D", text: "A marketing company" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q194",
    partId: "part-7",
    questionNumber: 194,
    passageGroupId: "part7-group-14",
    passage: "--- Passage 1: Building Notice ---\nNOTICE TO ALL TENANTS\nCENTRAL PLAZA OFFICE BUILDING\n\nPlease be informed that the lobby and main entrance of Central Plaza will undergo renovation starting Monday, February 5, through Friday, March 8. During this period, all tenants and visitors should use the south entrance on Elm Street.\n\nThe renovation will include new flooring, updated lighting, improved accessibility features, and a redesigned reception area. Elevator access from the south entrance will remain available at all times.\n\nWe appreciate your patience during this improvement period. For questions or concerns, contact Building Management at lobby@centralplaza.com.\n\n--- Passage 2: Tenant Response ---\nFrom: Daniel Ortiz <d.ortiz@brightlaw.com>\nTo: lobby@centralplaza.com\nDate: January 29\nSubject: Lobby Renovation — Client Access Concern\n\nDear Building Management,\n\nThank you for the advance notice about the lobby renovation. Our law firm, Bright & Associates, occupies the 8th floor and regularly receives clients throughout the day.\n\nI am concerned that the change in entrance may confuse our clients who are visiting for the first time. Would it be possible to place signage at the main entrance directing visitors to the south entrance? Additionally, could you provide us with a map we can email to clients ahead of their visits?\n\nThank you for your attention to this matter.\n\nDaniel Ortiz\nManaging Partner, Bright & Associates",
    stem: "What does Daniel Ortiz request?",
    options: [
      { label: "A", text: "A reduction in rent during renovation" },
      { label: "B", text: "Signage and a map for visitors" },
      { label: "C", text: "A temporary office space" },
      { label: "D", text: "Extended building hours" }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q195",
    partId: "part-7",
    questionNumber: 195,
    passageGroupId: "part7-group-14",
    passage: "--- Passage 1: Building Notice ---\nNOTICE TO ALL TENANTS\nCENTRAL PLAZA OFFICE BUILDING\n\nPlease be informed that the lobby and main entrance of Central Plaza will undergo renovation starting Monday, February 5, through Friday, March 8. During this period, all tenants and visitors should use the south entrance on Elm Street.\n\nThe renovation will include new flooring, updated lighting, improved accessibility features, and a redesigned reception area. Elevator access from the south entrance will remain available at all times.\n\nWe appreciate your patience during this improvement period. For questions or concerns, contact Building Management at lobby@centralplaza.com.\n\n--- Passage 2: Tenant Response ---\nFrom: Daniel Ortiz <d.ortiz@brightlaw.com>\nTo: lobby@centralplaza.com\nDate: January 29\nSubject: Lobby Renovation — Client Access Concern\n\nDear Building Management,\n\nThank you for the advance notice about the lobby renovation. Our law firm, Bright & Associates, occupies the 8th floor and regularly receives clients throughout the day.\n\nI am concerned that the change in entrance may confuse our clients who are visiting for the first time. Would it be possible to place signage at the main entrance directing visitors to the south entrance? Additionally, could you provide us with a map we can email to clients ahead of their visits?\n\nThank you for your attention to this matter.\n\nDaniel Ortiz\nManaging Partner, Bright & Associates",
    stem: "What improvement is NOT mentioned in the renovation plan?",
    options: [
      { label: "A", text: "New flooring" },
      { label: "B", text: "Updated lighting" },
      { label: "C", text: "A new parking garage" },
      { label: "D", text: "Improved accessibility features" }
    ],
    correctAnswer: "C"
  },

  // Group 15 (Q196-200) — Triple passage: job posting + resume + interview email — 5 questions
  {
    id: "lr-2022-1-q196",
    partId: "part-7",
    questionNumber: 196,
    passageGroupId: "part7-group-15",
    passage: "--- Passage 1: Job Posting ---\nSUMMIT HEALTHCARE GROUP\nPosition: Operations Manager\nLocation: Denver, CO\nSalary: $85,000 – $100,000\n\nSummit Healthcare Group is seeking an experienced Operations Manager to oversee daily operations at our Denver clinic. The ideal candidate will have 5+ years of experience in healthcare operations, a bachelor's degree in business administration or a related field, and strong leadership skills.\n\nKey responsibilities:\n• Managing a team of 25+ staff members\n• Ensuring compliance with healthcare regulations\n• Developing and implementing operational procedures\n• Managing vendor relationships and supply chain logistics\n\nApplications accepted through December 1. Send resume to hiring@summithealthcare.com.\n\n--- Passage 2: Resume Excerpt ---\nANNA PETROV\nDenver, CO | anna.petrov@email.com\n\nPROFESSIONAL EXPERIENCE\nAssistant Operations Manager — Lakewood Medical Center (2019 – Present)\n• Supervised a team of 18 clinical and administrative staff\n• Coordinated vendor contracts and reduced supply costs by 12%\n• Led implementation of a new electronic health records system\n\nOffice Coordinator — Pine Valley Clinic (2016 – 2019)\n• Managed daily scheduling for 6 physicians\n• Handled patient billing and insurance claims\n\nEDUCATION\nB.S. in Healthcare Administration — University of Colorado (2016)\n\n--- Passage 3: Interview Invitation ---\nFrom: HR Department <hiring@summithealthcare.com>\nTo: Anna Petrov <anna.petrov@email.com>\nDate: December 8\nSubject: Interview Invitation — Operations Manager Position\n\nDear Ms. Petrov,\n\nThank you for your application for the Operations Manager position. We were impressed by your qualifications and would like to invite you for an in-person interview.\n\nThe interview is scheduled for Wednesday, December 13, at 10:00 A.M. at our main office located at 500 Health Parkway, Suite 200, Denver. The interview will last approximately one hour and will include a brief tour of the facility.\n\nPlease bring a copy of your resume and two professional references. If the scheduled time does not work for you, please reply to this email to arrange an alternative.\n\nWe look forward to meeting you.\n\nBest regards,\nSummit Healthcare Group HR Department",
    stem: "What is required for the Operations Manager position?",
    options: [
      { label: "A", text: "A master's degree" },
      { label: "B", text: "Ten years of experience" },
      { label: "C", text: "Five or more years of healthcare operations experience" },
      { label: "D", text: "Medical certification" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q197",
    partId: "part-7",
    questionNumber: 197,
    passageGroupId: "part7-group-15",
    passage: "--- Passage 1: Job Posting ---\nSUMMIT HEALTHCARE GROUP\nPosition: Operations Manager\nLocation: Denver, CO\nSalary: $85,000 – $100,000\n\nSummit Healthcare Group is seeking an experienced Operations Manager to oversee daily operations at our Denver clinic. The ideal candidate will have 5+ years of experience in healthcare operations, a bachelor's degree in business administration or a related field, and strong leadership skills.\n\nKey responsibilities:\n• Managing a team of 25+ staff members\n• Ensuring compliance with healthcare regulations\n• Developing and implementing operational procedures\n• Managing vendor relationships and supply chain logistics\n\nApplications accepted through December 1. Send resume to hiring@summithealthcare.com.\n\n--- Passage 2: Resume Excerpt ---\nANNA PETROV\nDenver, CO | anna.petrov@email.com\n\nPROFESSIONAL EXPERIENCE\nAssistant Operations Manager — Lakewood Medical Center (2019 – Present)\n• Supervised a team of 18 clinical and administrative staff\n• Coordinated vendor contracts and reduced supply costs by 12%\n• Led implementation of a new electronic health records system\n\nOffice Coordinator — Pine Valley Clinic (2016 – 2019)\n• Managed daily scheduling for 6 physicians\n• Handled patient billing and insurance claims\n\nEDUCATION\nB.S. in Healthcare Administration — University of Colorado (2016)\n\n--- Passage 3: Interview Invitation ---\nFrom: HR Department <hiring@summithealthcare.com>\nTo: Anna Petrov <anna.petrov@email.com>\nDate: December 8\nSubject: Interview Invitation — Operations Manager Position\n\nDear Ms. Petrov,\n\nThank you for your application for the Operations Manager position. We were impressed by your qualifications and would like to invite you for an in-person interview.\n\nThe interview is scheduled for Wednesday, December 13, at 10:00 A.M. at our main office located at 500 Health Parkway, Suite 200, Denver. The interview will last approximately one hour and will include a brief tour of the facility.\n\nPlease bring a copy of your resume and two professional references. If the scheduled time does not work for you, please reply to this email to arrange an alternative.\n\nWe look forward to meeting you.\n\nBest regards,\nSummit Healthcare Group HR Department",
    stem: "How many years of total healthcare experience does Anna Petrov have?",
    options: [
      { label: "A", text: "About three years" },
      { label: "B", text: "About five years" },
      { label: "C", text: "About seven years" },
      { label: "D", text: "About ten years" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q198",
    partId: "part-7",
    questionNumber: 198,
    passageGroupId: "part7-group-15",
    passage: "--- Passage 1: Job Posting ---\nSUMMIT HEALTHCARE GROUP\nPosition: Operations Manager\nLocation: Denver, CO\nSalary: $85,000 – $100,000\n\nSummit Healthcare Group is seeking an experienced Operations Manager to oversee daily operations at our Denver clinic. The ideal candidate will have 5+ years of experience in healthcare operations, a bachelor's degree in business administration or a related field, and strong leadership skills.\n\nKey responsibilities:\n• Managing a team of 25+ staff members\n• Ensuring compliance with healthcare regulations\n• Developing and implementing operational procedures\n• Managing vendor relationships and supply chain logistics\n\nApplications accepted through December 1. Send resume to hiring@summithealthcare.com.\n\n--- Passage 2: Resume Excerpt ---\nANNA PETROV\nDenver, CO | anna.petrov@email.com\n\nPROFESSIONAL EXPERIENCE\nAssistant Operations Manager — Lakewood Medical Center (2019 – Present)\n• Supervised a team of 18 clinical and administrative staff\n• Coordinated vendor contracts and reduced supply costs by 12%\n• Led implementation of a new electronic health records system\n\nOffice Coordinator — Pine Valley Clinic (2016 – 2019)\n• Managed daily scheduling for 6 physicians\n• Handled patient billing and insurance claims\n\nEDUCATION\nB.S. in Healthcare Administration — University of Colorado (2016)\n\n--- Passage 3: Interview Invitation ---\nFrom: HR Department <hiring@summithealthcare.com>\nTo: Anna Petrov <anna.petrov@email.com>\nDate: December 8\nSubject: Interview Invitation — Operations Manager Position\n\nDear Ms. Petrov,\n\nThank you for your application for the Operations Manager position. We were impressed by your qualifications and would like to invite you for an in-person interview.\n\nThe interview is scheduled for Wednesday, December 13, at 10:00 A.M. at our main office located at 500 Health Parkway, Suite 200, Denver. The interview will last approximately one hour and will include a brief tour of the facility.\n\nPlease bring a copy of your resume and two professional references. If the scheduled time does not work for you, please reply to this email to arrange an alternative.\n\nWe look forward to meeting you.\n\nBest regards,\nSummit Healthcare Group HR Department",
    stem: "What achievement does Anna Petrov highlight at Lakewood Medical Center?",
    options: [
      { label: "A", text: "She hired 25 new employees." },
      { label: "B", text: "She reduced supply costs by 12%." },
      { label: "C", text: "She opened a new clinic." },
      { label: "D", text: "She doubled patient enrollment." }
    ],
    correctAnswer: "B"
  },
  {
    id: "lr-2022-1-q199",
    partId: "part-7",
    questionNumber: 199,
    passageGroupId: "part7-group-15",
    passage: "--- Passage 1: Job Posting ---\nSUMMIT HEALTHCARE GROUP\nPosition: Operations Manager\nLocation: Denver, CO\nSalary: $85,000 – $100,000\n\nSummit Healthcare Group is seeking an experienced Operations Manager to oversee daily operations at our Denver clinic. The ideal candidate will have 5+ years of experience in healthcare operations, a bachelor's degree in business administration or a related field, and strong leadership skills.\n\nKey responsibilities:\n• Managing a team of 25+ staff members\n• Ensuring compliance with healthcare regulations\n• Developing and implementing operational procedures\n• Managing vendor relationships and supply chain logistics\n\nApplications accepted through December 1. Send resume to hiring@summithealthcare.com.\n\n--- Passage 2: Resume Excerpt ---\nANNA PETROV\nDenver, CO | anna.petrov@email.com\n\nPROFESSIONAL EXPERIENCE\nAssistant Operations Manager — Lakewood Medical Center (2019 – Present)\n• Supervised a team of 18 clinical and administrative staff\n• Coordinated vendor contracts and reduced supply costs by 12%\n• Led implementation of a new electronic health records system\n\nOffice Coordinator — Pine Valley Clinic (2016 – 2019)\n• Managed daily scheduling for 6 physicians\n• Handled patient billing and insurance claims\n\nEDUCATION\nB.S. in Healthcare Administration — University of Colorado (2016)\n\n--- Passage 3: Interview Invitation ---\nFrom: HR Department <hiring@summithealthcare.com>\nTo: Anna Petrov <anna.petrov@email.com>\nDate: December 8\nSubject: Interview Invitation — Operations Manager Position\n\nDear Ms. Petrov,\n\nThank you for your application for the Operations Manager position. We were impressed by your qualifications and would like to invite you for an in-person interview.\n\nThe interview is scheduled for Wednesday, December 13, at 10:00 A.M. at our main office located at 500 Health Parkway, Suite 200, Denver. The interview will last approximately one hour and will include a brief tour of the facility.\n\nPlease bring a copy of your resume and two professional references. If the scheduled time does not work for you, please reply to this email to arrange an alternative.\n\nWe look forward to meeting you.\n\nBest regards,\nSummit Healthcare Group HR Department",
    stem: "What should Anna bring to the interview?",
    options: [
      { label: "A", text: "A portfolio of projects" },
      { label: "B", text: "Her college diploma" },
      { label: "C", text: "A resume and two professional references" },
      { label: "D", text: "A signed employment contract" }
    ],
    correctAnswer: "C"
  },
  {
    id: "lr-2022-1-q200",
    partId: "part-7",
    questionNumber: 200,
    passageGroupId: "part7-group-15",
    passage: "--- Passage 1: Job Posting ---\nSUMMIT HEALTHCARE GROUP\nPosition: Operations Manager\nLocation: Denver, CO\nSalary: $85,000 – $100,000\n\nSummit Healthcare Group is seeking an experienced Operations Manager to oversee daily operations at our Denver clinic. The ideal candidate will have 5+ years of experience in healthcare operations, a bachelor's degree in business administration or a related field, and strong leadership skills.\n\nKey responsibilities:\n• Managing a team of 25+ staff members\n• Ensuring compliance with healthcare regulations\n• Developing and implementing operational procedures\n• Managing vendor relationships and supply chain logistics\n\nApplications accepted through December 1. Send resume to hiring@summithealthcare.com.\n\n--- Passage 2: Resume Excerpt ---\nANNA PETROV\nDenver, CO | anna.petrov@email.com\n\nPROFESSIONAL EXPERIENCE\nAssistant Operations Manager — Lakewood Medical Center (2019 – Present)\n• Supervised a team of 18 clinical and administrative staff\n• Coordinated vendor contracts and reduced supply costs by 12%\n• Led implementation of a new electronic health records system\n\nOffice Coordinator — Pine Valley Clinic (2016 – 2019)\n• Managed daily scheduling for 6 physicians\n• Handled patient billing and insurance claims\n\nEDUCATION\nB.S. in Healthcare Administration — University of Colorado (2016)\n\n--- Passage 3: Interview Invitation ---\nFrom: HR Department <hiring@summithealthcare.com>\nTo: Anna Petrov <anna.petrov@email.com>\nDate: December 8\nSubject: Interview Invitation — Operations Manager Position\n\nDear Ms. Petrov,\n\nThank you for your application for the Operations Manager position. We were impressed by your qualifications and would like to invite you for an in-person interview.\n\nThe interview is scheduled for Wednesday, December 13, at 10:00 A.M. at our main office located at 500 Health Parkway, Suite 200, Denver. The interview will last approximately one hour and will include a brief tour of the facility.\n\nPlease bring a copy of your resume and two professional references. If the scheduled time does not work for you, please reply to this email to arrange an alternative.\n\nWe look forward to meeting you.\n\nBest regards,\nSummit Healthcare Group HR Department",
    stem: "What will happen during the interview besides the conversation?",
    options: [
      { label: "A", text: "A written examination" },
      { label: "B", text: "A group discussion" },
      { label: "C", text: "A facility tour" },
      { label: "D", text: "A skills demonstration" }
    ],
    correctAnswer: "C"
  }
];

// ---------------------------------------------------------------------------
// All questions combined + lookup function
// ---------------------------------------------------------------------------

const allQuestions: ToeicQuestion[] = [
  ...part1Questions,
  ...part2Questions,
  ...part3Questions,
  ...part4Questions,
  ...part5Questions,
  ...part6Questions,
  ...part7Questions
];

const sw1SpeakingQuestions: ToeicQuestion[] = [
  {
    id: "sw-1-speaking-q1",
    partId: "speak-1",
    questionNumber: 1,
    stem: "Read the text aloud: 'Thank you for calling Summit Airlines. Our office is currently closed. Our normal business hours are Monday through Friday, 9 A.M. to 5 P.M.'",
    options: [],
    correctAnswer: "A"
  },
  {
    id: "sw-1-speaking-q2",
    partId: "speak-1",
    questionNumber: 2,
    stem: "Read the text aloud: 'Attention passengers of flight 402 to Chicago. Due to inclement weather, our departure time has been delayed by approximately 45 minutes.'",
    options: [],
    correctAnswer: "A"
  }
];

const sw1WritingQuestions: ToeicQuestion[] = [
  {
    id: "sw-1-writing-q1",
    partId: "write-1",
    questionNumber: 1,
    stem: "Write a sentence about the picture using the keywords: 'working / laptop'.",
    options: [],
    correctAnswer: "A"
  },
  {
    id: "sw-1-writing-q2",
    partId: "write-1",
    questionNumber: 2,
    stem: "Write a sentence about the picture using the keywords: 'meeting / conference room'.",
    options: [],
    correctAnswer: "A"
  }
];

const questionsByTest: Record<string, ToeicQuestion[]> = {
  "lr-2022-1": allQuestions,
  "sw-1-speaking": sw1SpeakingQuestions,
  "sw-1-writing": sw1WritingQuestions
};

export function getQuestionsForTest(testId: string): ToeicQuestion[] {
  return questionsByTest[testId] ?? [];
}
