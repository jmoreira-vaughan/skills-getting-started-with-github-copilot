from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

TEST_ACTIVITY = "Programming Class"
TEST_EMAIL = "apitest@example.com"


def test_root_redirect():
    # Ensure root redirects to static/index.html
    resp = client.get("/", follow_redirects=False)
    assert resp.status_code in (301, 302, 307, 308)
    # Location header should point to the static index
    assert resp.headers.get("location") == "/static/index.html"


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect some known activity keys
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_signup_success_and_duplicate_and_not_found():
    # Clean up test email if present
    if TEST_EMAIL in activities[TEST_ACTIVITY]["participants"]:
        activities[TEST_ACTIVITY]["participants"].remove(TEST_EMAIL)

    # Successful signup
    resp = client.post(f"/activities/{TEST_ACTIVITY}/signup?email={TEST_EMAIL}")
    assert resp.status_code == 200
    assert TEST_EMAIL in activities[TEST_ACTIVITY]["participants"]

    # Duplicate signup should return 400
    resp2 = client.post(f"/activities/{TEST_ACTIVITY}/signup?email={TEST_EMAIL}")
    assert resp2.status_code == 400
    assert resp2.json()["detail"] == "Student is already signed up"

    # Cleanup for next tests
    activities[TEST_ACTIVITY]["participants"].remove(TEST_EMAIL)

    # Signup to non-existent activity -> 404
    resp3 = client.post("/activities/NoSuchActivity/signup?email=foo@example.com")
    assert resp3.status_code == 404
    assert resp3.json()["detail"] == "Activity not found"


def test_post_unregister_compatibility():
    # Ensure test email is present
    if TEST_EMAIL not in activities[TEST_ACTIVITY]["participants"]:
        activities[TEST_ACTIVITY]["participants"].append(TEST_EMAIL)

    # Use POST unregister endpoint for compatibility
    resp = client.post(f"/activities/{TEST_ACTIVITY}/unregister?email={TEST_EMAIL}")
    assert resp.status_code == 200
    assert TEST_EMAIL not in activities[TEST_ACTIVITY]["participants"]

    # Calling unregister again should return 400
    resp2 = client.post(f"/activities/{TEST_ACTIVITY}/unregister?email={TEST_EMAIL}")
    assert resp2.status_code == 400
    assert resp2.json()["detail"] == "Student is not signed up"
