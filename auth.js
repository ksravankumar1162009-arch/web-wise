// Classroom demo only. This is not real authentication.

var isQuizPage =
  document.documentElement.classList.contains("quiz-page");

var signedIn = false;

try {
  signedIn = sessionStorage.getItem("webQuizSignedIn") === "true";
} catch (error) {}

// Show the quiz only after demo sign-in.
if (isQuizPage) {
  if (signedIn) {
    document.documentElement.classList.add("signed-in");
  } else {
    window.location.replace("login.html");
  }
}

// Read demo accounts from this browser.
function readUsers() {
  var users = JSON.parse(
    localStorage.getItem("webQuizUsers") || "[]"
  );

  if (!Array.isArray(users)) {
    throw new Error("Saved demo accounts cannot be read.");
  }

  for (var i = 0; i < users.length; i++) {
    if (
      !users[i] ||
      typeof users[i].email !== "string" ||
      typeof users[i].salt !== "string" ||
      typeof users[i].hash !== "string"
    ) {
      throw new Error("Saved demo accounts cannot be read.");
    }
  }

  return users;
}

// Save a salted hash instead of the password itself.
async function passwordHash(password, salt) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error(
      "Open the project using Live Server or HTTPS."
    );
  }

  var encoder = new TextEncoder();

  var key = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  var bits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    key,
    256
  );

  return Array.from(new Uint8Array(bits), function (b) {
    return b.toString(16).padStart(2, "0");
  }).join("");
}

// SIGN IN
var signinForm = document.getElementById("signin-form");

if (signinForm) {
  var success = document.getElementById("registration-success");

  if (
    success &&
    new URLSearchParams(window.location.search)
      .get("registered") === "1"
  ) {
    success.hidden = false;
  }

  signinForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    var email = document.getElementById("signin-email")
      .value.trim().toLowerCase();

    var password = document.getElementById("signin-password").value;
    var message = document.getElementById("signin-error");
    var button = this.querySelector("button[type='submit']");

    message.textContent = "";
    button.disabled = true;

    try {
      var valid =
        email === "student@webquiz.com" &&
        password === "quiz123";

      if (!valid) {
        var user = readUsers().find(function (item) {
          return item.email === email;
        });

        if (user) {
          valid =
            await passwordHash(password, user.salt) === user.hash;
        }
      }

      if (!valid) {
        throw new Error(
          "Email or password is incorrect. Try again or register first."
        );
      }

      sessionStorage.setItem("webQuizSignedIn", "true");
      window.location.replace("welcome.html");

    } catch (error) {
      message.textContent =
        error.message || "Sign-in failed. Check browser storage.";

    } finally {
      button.disabled = false;
    }
  });
}

// REGISTER
var registerForm = document.getElementById("register-form");

if (registerForm) {
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    var name = document.getElementById("register-name").value.trim();

    var email = document.getElementById("register-email")
      .value.trim().toLowerCase();

    var password = document.getElementById("register-password").value;
    var confirm = document.getElementById("register-confirm").value;
    var message = document.getElementById("register-error");
    var button = this.querySelector("button[type='submit']");

    message.textContent = "";
    button.disabled = true;

    try {
      if (!name) {
        throw new Error("Please enter your name.");
      }

      if (password.length < 6) {
        throw new Error("Use at least 6 characters.");
      }

      if (password !== confirm) {
        throw new Error("The passwords do not match.");
      }

      var users = readUsers();

      if (
        email === "student@webquiz.com" ||
        users.some(function (user) {
          return user.email === email;
        })
      ) {
        throw new Error(
          "This email is already registered. Please sign in."
        );
      }

      if (!window.crypto || !window.crypto.subtle) {
        throw new Error(
          "Open the project using Live Server or HTTPS."
        );
      }

      var salt = Array.from(
        window.crypto.getRandomValues(new Uint8Array(16))
      ).join("-");

      var hash = await passwordHash(password, salt);

      users = readUsers();

      if (users.some(function (user) {
        return user.email === email;
      })) {
        throw new Error(
          "This email is already registered. Please sign in."
        );
      }

      users.push({
        name: name,
        email: email,
        salt: salt,
        hash: hash
      });

      localStorage.setItem("webQuizUsers", JSON.stringify(users));
      window.location.replace("login.html?registered=1");

    } catch (error) {
      message.textContent =
        error.message || "Registration failed. Check browser storage.";

    } finally {
      button.disabled = false;
    }
  });
}

// SIGN OUT
var signoutButton = document.getElementById("signout-btn");

if (signoutButton) {
  signoutButton.addEventListener("click", function () {
    try {
      sessionStorage.removeItem("webQuizSignedIn");
    } catch (error) {}

    document.documentElement.classList.remove("signed-in");
    window.location.replace("login.html");
  });
}

// Recheck when returning with the Back button.
window.addEventListener("pageshow", function () {
  if (isQuizPage) {
    var active = false;

    try {
      active =
        sessionStorage.getItem("webQuizSignedIn") === "true";
    } catch (error) {}

    if (!active) {
      document.documentElement.classList.remove("signed-in");
      window.location.replace("login.html");
    }
  }
});