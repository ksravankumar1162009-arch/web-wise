// Questions stay in HTML.
// JavaScript controls navigation and the final score.

(function () {
  var topics = document.querySelectorAll("details.topic-card");

  var isPlayer =
    window.location.pathname.endsWith("/quiz.html");

  function topicName(topic) {
    var title = topic.querySelector(".topic-title").cloneNode(true);
    var small = title.querySelector("small");

    if (small) small.remove();

    return title.textContent.trim();
  }

  // HOME PAGE: make each topic open quiz.html.
  if (!isPlayer) {
    for (var i = 0; i < topics.length; i++) {
      var link = document.createElement("a");

      link.className = "topic-card topic-link";
      link.href = "quiz.html?topic=" + i;

      link.innerHTML =
        topics[i].querySelector("summary").innerHTML;

      link.setAttribute(
        "aria-label",
        "Start " + topicName(topics[i]) + " quiz"
      );

      link.querySelector(".open-icon").textContent = "→";

      topics[i].replaceWith(link);
    }

    return;
  }

  // QUIZ PAGE
  document.body.classList.add("question-page");

  // Make header links return to the home page.
  document.querySelectorAll(
    ".site-header a[href^='#']"
  ).forEach(function (link) {
    link.setAttribute(
      "href",
      "index.html" + link.getAttribute("href")
    );
  });

  var main = document.querySelector("main");
  var panel = document.createElement("section");

  panel.className = "question-panel";

  var value =
    new URLSearchParams(window.location.search).get("topic");

  var number = Number(value);

  // Handle a missing or incorrect topic.
  if (
    value === null ||
    !/^\d+$/.test(value) ||
    !topics[number]
  ) {
    panel.innerHTML =
      "<h1>Choose a topic first</h1>" +
      "<p>This quiz topic is unavailable.</p>" +
      '<a class="button" href="index.html#topics">' +
      "Back to topics</a>";

    main.replaceChildren(panel);
    return;
  }

  var topic = topics[number];
  var questions = topic.querySelectorAll("fieldset");

  var current = 0;
  var score = 0;

  document.title = topicName(topic) + " | Web Wise";

  // Create the question and result area.
  panel.innerHTML =
    '<a class="back-topics" href="index.html#topics">' +
      "← Back to topics</a>" +
    '<h1 id="quiz-title"></h1>' +
    '<p id="question-counter" class="muted" aria-live="polite"></p>' +
    '<div id="question-area"></div>' +
    '<button id="next-question" type="button" disabled>' +
      "Next question →</button>" +
    '<section id="final-result" hidden>' +
      '<h2 id="result-heading" tabindex="-1">Quiz complete!</h2>' +
      '<p id="final-score" class="score-display"></p>' +
      '<p id="final-message"></p>' +
      '<div class="form-actions">' +
        '<button id="retry-quiz" class="secondary" type="button">' +
          "Try again</button>" +
        '<a class="button" href="index.html#topics">' +
          "Choose another topic</a>" +
      "</div>" +
    "</section>";

  var area = panel.querySelector("#question-area");
  var counter = panel.querySelector("#question-counter");
  var next = panel.querySelector("#next-question");
  var result = panel.querySelector("#final-result");

  panel.querySelector("#quiz-title").textContent =
    topicName(topic);

  // Move the selected topic's HTML questions into the quiz area.
  for (var j = 0; j < questions.length; j++) {
    area.appendChild(questions[j]);
  }

  main.replaceChildren(panel);

  // Show only the current question.
  function showQuestion() {
    for (var k = 0; k < questions.length; k++) {
      questions[k].hidden = k !== current;
      questions[k].disabled = k !== current;
    }

    counter.textContent =
      "Question " + (current + 1) + " of " + questions.length;

    next.textContent =
      current === questions.length - 1
        ? "See result →"
        : "Next question →";

    next.disabled = true;

    var legend = questions[current].querySelector("legend");
    legend.tabIndex = -1;
    legend.focus();
  }

  // Start or restart the quiz.
  function startQuiz() {
    current = 0;
    score = 0;

    area.querySelectorAll("input").forEach(function (input) {
      input.checked = false;
    });

    area.hidden = false;
    counter.hidden = false;
    next.hidden = false;
    result.hidden = true;

    showQuestion();
  }

  // Enable Next after an answer is selected.
  area.addEventListener("change", function () {
    if (current >= questions.length) return;

    next.disabled =
      !questions[current].querySelector("input:checked");
  });

  // Check the answer and move forward.
  next.addEventListener("click", function () {
    if (current >= questions.length) return;

    var selected =
      questions[current].querySelector("input:checked");

    if (!selected) return;

    if (
      selected.value === questions[current].dataset.answer
    ) {
      score++;
    }

    current++;

    if (current < questions.length) {
      showQuestion();
    } else {
      // Display the result after the final question.
      area.hidden = true;
      counter.hidden = true;
      next.hidden = true;
      result.hidden = false;

      panel.querySelector("#final-score").textContent =
        score + " / " + questions.length;

      panel.querySelector("#final-message").textContent =
        Math.round(score / questions.length * 100) +
        "% correct. " +
        (
          score === questions.length
            ? "Excellent work!"
            : "Keep practising and try again!"
        );

      panel.querySelector("#result-heading").focus();
    }
  });

  panel.querySelector("#retry-quiz")
    .addEventListener("click", startQuiz);

  startQuiz();
})();