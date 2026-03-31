from flask import Flask, request, redirect
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
    return redirect(linkedin_handler.get_auth_url())


@app.route("/linkedin/callback")
def linkedin_callback():
    """Handle LinkedIn OAuth callback, store token, redirect to frontend."""
    authorization_code = request.args.get("code")
    if not authorization_code:
        return redirect(f"{FRONTEND_URL}/auth/callback?error=no_code")
    linkedin_handler.get_access_token(authorization_code)
    token = linkedin_handler.get_token()
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

    body = request.json
    if not body or "description" not in body or "skills" not in body:
        return {"error": "Missing required fields: description, skills"}, 400
    description = body["description"]
    skills = body["skills"]
    answer = gpt_handler.ask_question(description, skills)
    return answer


@app.route("/postPost", methods=["POST"])
def post_post():
    token = _get_bearer_token()
    if not token:
        return {"error": "Missing token"}, 401
    linkedin_handler.set_token(token)

    body = request.json
    if not body or "text" not in body:
        return {"error": "Missing required field: text"}, 400
    post_content = body["text"]
    response = linkedin_handler.post(post_content)
    return response
