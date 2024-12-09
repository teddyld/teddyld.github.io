const serverUrl = "https://teddyld-api.vercel.app";

/* Change window title on blur */
const documentTitle = document.querySelector("title");

const handleWindowFocus = () => {
  documentTitle.innerText = "ʕ´•ᴥ•`ʔ teddyld";
};
const handleWindowBlur = () => {
  documentTitle.innerText = "⍝ʕ´•ᴥ•`ʔ⍝ teddyld";
};

window.addEventListener("blur", handleWindowBlur);
window.addEventListener("focus", handleWindowFocus);

const cleanupEventListeners = () => {
  window.removeEventListener("blur", handleWindowBlur);
  window.removeEventListener("focus", handleWindowFocus);
};

if (window.closed) {
  cleanupEventListeners();
}

const addStatusSuccess = (element) => {
  element.classList.add("status-success");
  element.innerText = "OK";
};

const addStatusFailed = (element) => {
  element.classList.add("status-failed");
  element.innerText = "FAILED";
};

const serverStatus = document.querySelector("#server-status");
const checkServerStatus = async () => {
  try {
    await fetch(`${serverUrl}/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    });
    addStatusSuccess(serverStatus);
  } catch (err) {
    addStatusFailed(serverStatus);
  }
};

checkServerStatus();

/* Update visit counts */
const counterVisits = document.querySelector("#counter-visits");
const counterUnique = document.querySelector("#counter-unique");
const counterOnline = document.querySelector("#counter-onsite");

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const MAX_DELAY = 300;
const MIN_DELAY = 100;
const MAX_NUMBERS = 6;

const counterLoadingAnimation = (counter) => {
  const randomDelay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
  const id = setInterval(() => {
    let randomCount = "";
    for (let j = 0; j < MAX_NUMBERS; j++) {
      randomCount += numbers[Math.floor(Math.random() * numbers.length)];
    }
    counter.innerText = randomCount;
  }, randomDelay);
  return { id: id, delay: randomDelay };
};

const counterFinishingAnimation = (counter, delay, finalCount) => {
  let startCount =
    "0".repeat(MAX_NUMBERS - counter.innerText.length) + counter.innerText;
  if (!startCount) {
    counter.innerText = finalCount;
    return;
  }

  let finalCountString = finalCount.toString();
  // Length of final count
  const finalCountLength = finalCountString.length;

  // Add leading zeroes to final count
  finalCountString =
    "0".repeat(MAX_NUMBERS - finalCountLength) + finalCountString;

  const id = setInterval(() => {
    // Decrement leading digits to zero and remaining to digits in finalCount
    const startCountArray = startCount.split("");

    for (let i = 0; i < MAX_NUMBERS; i++) {
      if (startCountArray[i] !== "0" && i < MAX_NUMBERS - finalCountLength) {
        startCountArray[i] = (parseInt(startCountArray[i]) - 1).toString();
        break;
      } else if (
        i >= MAX_NUMBERS - finalCountLength &&
        startCountArray[i] !== finalCountString[i]
      ) {
        if (parseInt(startCountArray[i]) < parseInt(finalCountString[i])) {
          startCountArray[i] = (parseInt(startCountArray[i]) + 1).toString();
        } else {
          startCountArray[i] = (parseInt(startCountArray[i]) - 1).toString();
        }
        break;
      }
    }

    startCount = startCountArray.join("");
    counter.innerText = startCount.replace(/^0+/, "");
    // Interval terminating condition
    if (startCount === finalCountString) {
      counter.innerText = finalCount;
      clearInterval(id);
    }
  }, delay);
};

const { id: counterVisitsLoadingId, delay: visitsDelay } =
  counterLoadingAnimation(counterVisits);
const { id: counterUniqueLoadingId, delay: uniqueDelay } =
  counterLoadingAnimation(counterUnique);
const { id: counterOnlineLoadingId, delay: onlineDelay } =
  counterLoadingAnimation(counterOnline);

const updateVisits = async () => {
  try {
    const response = await fetch(`${serverUrl}/visits/update`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        user: localStorage.getItem("user"),
      }),
    });

    clearInterval(counterVisitsLoadingId);
    clearInterval(counterUniqueLoadingId);
    clearInterval(counterOnlineLoadingId);

    const { user, visits, unique, online } = await response.json();

    // Play finishing animation before loading true count
    counterFinishingAnimation(counterVisits, visitsDelay, visits);
    counterFinishingAnimation(counterUnique, uniqueDelay, unique);
    counterFinishingAnimation(counterOnline, onlineDelay, online);

    if (!localStorage.getItem("user")) {
      localStorage.setItem("user", user);
    }
  } catch (err) {
    addStatusFailed(serverStatus);
  }
};

// Poll count of visitors
const POLL_INTERVAL = 600000; // 10 minutes
const pollVisits = () => {
  setInterval(() => {
    updateVisits();
  }, POLL_INTERVAL);
};

updateVisits();
pollVisits();

// Heartbeat to maintain user's online status
const setUserOnline = async () => {
  if (!localStorage.getItem("user")) {
    return;
  }

  await fetch(`${serverUrl}/visits/online`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      user: localStorage.getItem("user"),
    }),
  });
};

const HEARTBEAT_INTERVAL = 3600000; // 1 hour
setInterval(() => {
  setUserOnline();
}, HEARTBEAT_INTERVAL);
