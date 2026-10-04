// ============ login section ============
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

if (loginForm) {
    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const loginError = document.getElementById("loginError");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const getLoginEmail = loginEmail.value.trim();
        const getLoginPassword = loginPassword.value.trim();

        try {
            const response = await fetch("http://localhost:3000/instructors");
            const data = await response.json();

            const instructor = data.find(
                (inst) =>
                    inst.email.toLowerCase() === getLoginEmail.toLowerCase() &&
                    inst.password === getLoginPassword
            );

            if (instructor) {
                sessionStorage.setItem("instructorId", instructor.id);
                location.href = "dashboard.html";
                console.log("Login successful");
            } else {
                loginError.textContent = "Invalid email or password";
                console.log("Login failed");
            }
        } catch (err) {
            loginError.textContent = "Server error. Is json-server running?";
            console.error(err);
        }
    });
}

// ============ signup section ============
if (signupForm) {
    const firstName = document.getElementById("firstName");
    const lastName = document.getElementById("lastName");
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const signupError = document.getElementById("signupError");

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const getFirstName = firstName.value.trim();
        const getLastName = lastName.value.trim();
        const getEmail = signupEmail.value.trim();
        const getPassword = signupPassword.value;
        const getConfirmPassword = confirmPassword.value;

        // ---- Validation ----
        if (getFirstName === "") {
            signupError.textContent = "First name is empty";
            return;
        }
        if (getLastName === "") {
            signupError.textContent = "Last name is empty";
            return;
        }
        if (getEmail === "") {
            signupError.textContent = "Email is empty";
            return;
        }
               if (getPassword === "") {
            signupError.textContent = "Password is empty";
            return;
        }
        if (getPassword.length < 8) {
            signupError.textContent = "Password must be at least 8 characters";
            return;
        }
        if (getPassword !== getConfirmPassword) {
            signupError.textContent = "Password and confirm password don't match";
            return;
        }

        try {
            // ---- Check if email already exists ----
            const response = await fetch("http://localhost:3000/instructors");
            const getData = await response.json();

            const emailIsFound = getData.find(
                (inst) => inst.email.toLowerCase() === getEmail.toLowerCase()
            );
            if (emailIsFound) {
                signupError.textContent = "Email is already registered";
                return;
            }

            // ---- Create new instructor ----
            const addNewId = await fetch("http://localhost:3000/instructors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: getFirstName,
                    lastName: getLastName,
                    username: getFirstName,
                    email: getEmail,
                    password: getPassword,
                    students: []
                })
            });

            if (addNewId.ok) {
                const newUser = await addNewId.json();
                sessionStorage.setItem("instructorId", newUser.id);
                location.href = "dashboard.html";
            } else {
                signupError.textContent = "Failed to create account";
            }
        } catch (err) {
            signupError.textContent = "Server error. Is json-server running?";
            console.error(err);
        }
    });
}