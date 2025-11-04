document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset lists
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Template for cards
      const template = document.getElementById("activity-card-template");

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        // Clone template and populate fields
        const clone = template.content.cloneNode(true);
        clone.querySelector(".activity-title").textContent = name;
        clone.querySelector(".activity-description").textContent = details.description;
        clone.querySelector(".activity-time").textContent = details.schedule;

        // Show availability
        const spotsLeft = details.max_participants - details.participants.length;
        const availEl = document.createElement("p");
        availEl.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`;
        const descEl = clone.querySelector(".activity-description");
        descEl.insertAdjacentElement("afterend", availEl);

        // Populate participants list
        const participantsList = clone.querySelector(".participants-list");
        participantsList.innerHTML = "";
        if (!details.participants || details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet";
          participantsList.appendChild(li);
        } else {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.textContent = p;
            participantsList.appendChild(li);
          });
        }

        activitiesList.appendChild(clone);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities to show updated participants and availability
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
