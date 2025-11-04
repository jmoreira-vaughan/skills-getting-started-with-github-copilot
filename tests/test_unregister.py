from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

TEST_ACTIVITY = "Chess Club"
TEST_EMAIL = "testuser@example.com"


def test_unregister_success_and_undo():
    # Ensure test email is not present
    if TEST_EMAIL in activities[TEST_ACTIVITY]["participants"]:
        activities[TEST_ACTIVITY]["participants"].remove(TEST_EMAIL)

    # Sign up the test user first
    resp_signup = client.post(f"/activities/{TEST_ACTIVITY}/signup?email={TEST_EMAIL}")
    assert resp_signup.status_code == 200
    assert TEST_EMAIL in activities[TEST_ACTIVITY]["participants"]

    # Now delete the participant using DELETE
    resp_delete = client.delete(f"/activities/{TEST_ACTIVITY}/participants?email={TEST_EMAIL}")
    assert resp_delete.status_code == 200
    data = resp_delete.json()
    assert "Unregistered" in data["message"]
    assert TEST_EMAIL not in activities[TEST_ACTIVITY]["participants"]

    # Undo by signing up again
    resp_undo = client.post(f"/activities/{TEST_ACTIVITY}/signup?email={TEST_EMAIL}")
    assert resp_undo.status_code == 200
    assert TEST_EMAIL in activities[TEST_ACTIVITY]["participants"]

    # Clean up
    activities[TEST_ACTIVITY]["participants"].remove(TEST_EMAIL)


def test_unregister_not_signed():
    email = "nosuch@example.com"
    if email in activities[TEST_ACTIVITY]["participants"]:
        activities[TEST_ACTIVITY]["participants"].remove(email)

    resp = client.delete(f"/activities/{TEST_ACTIVITY}/participants?email={email}")
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Student is not signed up"


def test_unregister_activity_not_found():
    resp = client.delete(
        "/activities/NoSuchActivity/participants?email=foo@example.com"
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Activity not found"
