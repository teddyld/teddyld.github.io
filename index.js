const serverUrl = "https://teddyld-github-io.vercel.app";

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

const statusOK = (element) => {
  element.classList.remove("status-failed");
  if (!element.classList.contains("status-success")) {
    element.classList.add("status-success");
  }
  element.innerText = "OK";
};

const statusFailed = (element) => {
  element.classList.remove("status-success");
  if (!element.classList.contains("status-failed")) {
    element.classList.add("status-failed");
  }
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
    statusOK(serverStatus);
  } catch (err) {
    statusFailed(serverStatus);
  }
};

/* Fetch recently played song */

const vibesStatus = document.querySelector("#vibes-status");
const vibesName = document.querySelector("#vibes-name");
const vibesArtist = document.querySelector("#vibes-artist");
const vibesImage = document.querySelector("#vibes-image");
const vibesLink = document.querySelector("#vibes-link");
const vibesMessage = document.querySelector("#vibes-message");

const getSong = async () => {
  try {
    const response = await fetch(`${serverUrl}/vibes`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    });

    const result = await response.json();
    const { artist, name, image, url } = result;

    vibesName.innerText = name;
    vibesArtist.innerText = artist;
    vibesImage.setAttribute("src", image);
    vibesLink.setAttribute("href", url);
    vibesImage.classList.remove("hidden");
    vibesMessage.classList.add("hidden");

    statusOK(vibesStatus);
  } catch (err) {
    vibesImage.classList.add("hidden");
    vibesMessage.classList.remove("hidden");
    statusFailed(vibesStatus);
  }
};

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
  checkServerStatus();
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
    statusFailed(serverStatus);
  }
};

// Poll count of visitors and song
const POLL_INTERVAL = 3600000; // 1 hr
const pollVisits = () => {
  setInterval(() => {
    getSong();
    updateVisits();
  }, POLL_INTERVAL);
};

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

/* Skills filtering */
const skillsList = document.querySelectorAll(".skills-list");
const projectsList = document.querySelectorAll(".project");
const projectSection = document.querySelector("#projects");
const emptyMessage = document.querySelector("#message");

// Parse projects ids into their skills
const projectSkills = {};

for (const project of projectsList) {
  const id = project.id;
  const skills = [];
  const skillsDiv = project.querySelector(".project-skills");
  for (const skill of skillsDiv.children) {
    skills.push(skill);
  }

  projectSkills[id] = { skills, project };
}

const filteredSkills = [];

const filterProjects = (target) => {
  if (filteredSkills.includes(target)) {
    const index = filteredSkills.indexOf(target);
    filteredSkills.splice(index, 1);
  } else {
    filteredSkills.push(target);
  }

  for (const [_, info] of Object.entries(projectSkills)) {
    const skillDivs = info.skills;
    const project = info.project;
    const skills = skillDivs.map((div) => div.innerText);

    let visible = true;
    for (const idx in filteredSkills) {
      // Filtered skills contains skill not in project
      if (!skills.includes(filteredSkills[idx])) {
        visible = false;
        project.classList.add("hidden");
      } else {
        const skillIdx = skills.indexOf(filteredSkills[idx]);
        skillDivs[skillIdx].classList.add("skill-selected");
      }
    }

    if (visible) {
      project.classList.remove("hidden");
    }

    // Update style of project skills if they are in filtered skills
    for (const div of skillDivs) {
      if (!filteredSkills.includes(div.innerText)) {
        div.classList.remove("skill-selected");
      } else {
        div.classList.add("skill-selected");
      }
    }
  }

  // Check if any projects match the filtered skills
  for (const child of projectSection.children) {
    if (!child.classList.contains("hidden") && child.id !== "message") {
      emptyMessage.classList.add("hidden");
      return;
    }
  }

  emptyMessage.classList.remove("hidden");
};

for (const grp of skillsList) {
  for (const btn of grp.children) {
    const target = btn.innerText.replace(/\n/g, "").trim();
    btn.addEventListener("click", function () {
      if (filteredSkills.includes(target)) {
        btn.classList.remove("skill-selected");
      } else {
        btn.classList.add("skill-selected");
      }

      filterProjects(target);
    });
  }
}

/* Tab-list Navigation */

const aboutToggle = document.querySelector("#about-toggle");
const skillsToggle = document.querySelector("#skills-toggle");
const faqToggle = document.querySelector("#faq-toggle");

const aboutContent = document.querySelector("#about");
const skillsContent = document.querySelector("#skills");
const faqContent = document.querySelector("#faq");

const pageSectionTop = {
  about: [aboutToggle, aboutContent],
  skills: [skillsToggle, skillsContent],
  faq: [faqToggle, faqContent],
};

const handleNavigationToggle = (type, section) => {
  const target = section[type];
  target[0].classList.add("selected");
  target[1].classList.remove("hidden");

  for (let key in section) {
    if (key !== type) {
      const rest = section[key];
      rest[0].classList.remove("selected");
      rest[1].classList.add("hidden");
    }
  }
};

aboutToggle.addEventListener("click", function () {
  handleNavigationToggle("about", pageSectionTop);
});
skillsToggle.addEventListener("click", function () {
  handleNavigationToggle("skills", pageSectionTop);
});
faqToggle.addEventListener("click", function () {
  handleNavigationToggle("faq", pageSectionTop);
});

updateVisits();
pollVisits();
getSong();
