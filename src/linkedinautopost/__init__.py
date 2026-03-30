import secrets

from flask import Flask, request, redirect, session
from flask_cors import CORS

from linkedinautopost.facade.chat_gpt import ChatGPT
from linkedinautopost.facade.linkedin import LinkedIn
from linkedinautopost.utils.config import config

app = Flask(__name__)
app.secret_key = config.get("app.secret_key", "dev-secret-key")

linkedin_handler = LinkedIn()
gpt_handler = ChatGPT()

FRONTEND_URL = config.get("app.frontend_url", "http://localhost:3000")

CORS(app, origins=[FRONTEND_URL], supports_credentials=False)


def _get_bearer_token() -> str | None:
    """Extract Bearer token from the Authorization header."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


@app.route("/")
def hello():
    return "Hello, World!"


@app.route("/login")
def login():
    """Redirect the user's browser to the LinkedIn OAuth consent screen."""
    state_token = secrets.token_urlsafe(16)
    session["oauth_state"] = state_token
    return redirect(linkedin_handler.get_auth_url(state=state_token))


@app.route("/linkedin/callback")
def linkedin_callback():
    """Handle LinkedIn OAuth callback, store token, redirect to frontend."""
    # Verify CSRF state parameter
    received_state = request.args.get("state")
    expected_state = session.pop("oauth_state", None)
    if received_state != expected_state:
        return redirect(f"{FRONTEND_URL}/auth/callback?error=state_mismatch")

    authorization_code = request.args.get("code")
    if not authorization_code:
        return redirect(f"{FRONTEND_URL}/auth/callback?error=no_code")

    linkedin_handler.get_access_token(authorization_code)
    # get_access_token already sets __access_token, __headers, and __user_info
    # We expose the token to the frontend so it can attach it to future requests.
    token = linkedin_handler._LinkedIn__access_token  # read private attr for redirect
    return redirect(f"{FRONTEND_URL}/auth/callback?token={token}")


@app.route("/me")
def me():
    """Return basic user info; used by frontend to confirm session is valid."""
    token = _get_bearer_token()
    if not token:
        return {"error": "Missing token"}, 401
    linkedin_handler.set_token(token)
    return {
        "authenticated": True,
        "name": linkedin_handler.get_user_name(),
    }


@app.route("/makePostContent", methods=["POST"])
def make_post_content():
    token = _get_bearer_token()
    if not token:
        return {"error": "Missing token"}, 401
    linkedin_handler.set_token(token)

    description = request.json["description"]
    skills = request.json["skills"]
    answer = gpt_handler.ask_question(description, skills)
    return answer


@app.route("/postPost", methods=["POST"])
def post_post():
    token = _get_bearer_token()
    if not token:
        return {"error": "Missing token"}, 401
    linkedin_handler.set_token(token)

    post_content = request.json["text"]
    response = linkedin_handler.post(post_content)
    return response
