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

        // Populate participants list (with unregister/delete button)
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
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            const btn = document.createElement("button");
            btn.className = "participant-delete";
            btn.type = "button";
            btn.setAttribute("aria-label", `Unregister ${p}`);
            btn.title = "Unregister";
            btn.innerHTML = "✖"; // simple cross icon

            // Click handler: confirm, call backend DELETE to unregister, and show undo
            btn.addEventListener("click", async (e) => {
              e.preventDefault();

              // Ask for confirmation before deleting
              const confirmed = window.confirm(`Are you sure you want to unregister ${p} from ${name}?`);
              if (!confirmed) return;

              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                const result = await response.json();

                if (response.ok) {
                  // Show success with an undo action
                  messageDiv.innerHTML = `${result.message} <button id=\"undo-btn\" class=\"undo-btn\">Undo</button>`;
                  messageDiv.className = "message success";
                  messageDiv.classList.remove("hidden");

                  // Handler for undo: re-signup the participant
                  const undoBtn = messageDiv.querySelector("#undo-btn");
                  let undoClicked = false;
                  if (undoBtn) {
                    undoBtn.addEventListener("click", async () => {
                      try {
                        const r2 = await fetch(
                          `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`,
                          { method: "POST" }
                        );
                        const res2 = await r2.json();
                        if (r2.ok) {
                          messageDiv.textContent = `Undo successful: ${res2.message}`;
                          messageDiv.className = "message success";
                          await fetchActivities();
                        } else {
                          messageDiv.textContent = res2.detail || "Failed to undo";
                          messageDiv.className = "message error";
                        }
                      } catch (err) {
                        messageDiv.textContent = "Failed to undo. Please try again.";
                        messageDiv.className = "message error";
                        console.error("Error undoing unregister:", err);
                      }
                      undoClicked = true;
                    });
                  }

                  // Refresh activities to reflect removal
                  await fetchActivities();

                  // Hide message after 6 seconds if undo wasn't clicked
                  setTimeout(() => {
                    if (!undoClicked) messageDiv.classList.add("hidden");
                  }, 6000);
                } else {
                  messageDiv.textContent = result.detail || "An error occurred";
                  messageDiv.className = "message error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (error) {
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "message error";
                messageDiv.classList.remove("hidden");
                console.error("Error unregistering:", error);
              }
            });

            li.appendChild(span);
            li.appendChild(btn);
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
