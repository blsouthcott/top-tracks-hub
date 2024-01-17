import os
from random import choice
from datetime import datetime, timedelta
import pickle
from string import ascii_letters, digits

from flask import request, jsonify
from flask_restful import Resource
from marshmallow import ValidationError
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from werkzeug.security import check_password_hash, generate_password_hash
from flask_mail import Message

from .schemas import SignupSchema, VerifyAccountSchema, LoginSchema
from ..app import mail
from ..models import db, User, AccountVerification
from ..utils.logging_utils import logger


def clear_expired_verification_codes():
    account_verifications = AccountVerification.query.all()
    for account_verification in account_verifications:
        if account_verification.expires < datetime.now().timestamp():
            db.session.delete(account_verification)
    db.session.commit()


class Signup(Resource):
    def post(self):
        schema = SignupSchema()
        try:
            req = schema.load(request.get_json())
        except ValidationError as err:
            return err.messages, 400

        user = User.query.get(req["email"])
        if user:
            return "email address already exists in the database", 409

        # If a user attempted to sign up but did not complete the process and and thus their email is not present in the database
        #   delete the previous verification code and allow them to continue with the sign up process as usual
        if account_verification := AccountVerification.query.get(req["email"]):
            db.session.delete(account_verification)
            db.session.commit()

        verification_code = "".join([choice(ascii_letters + digits) for _ in range(32)])
        user = User(
            email=req["email"],
            name=req["name"],
            password=generate_password_hash(req["password"]),
        )
        pickled_user = pickle.dumps(user)

        account_verification = AccountVerification(
            verification_code=verification_code,
            expires=(datetime.now() + timedelta(hours=24.0)).timestamp(),
            user_obj=pickled_user,
        )
        db.session.add(account_verification)
        db.session.commit()
        clear_expired_verification_codes()
        
        msg = Message("Verify Top Tracks Account", recipients=[req["email"]])
        base_url = os.getenv("BASE_URL", "http://127.0.0.1:5001")
        verification_url = f"{base_url}/api/verify-account?code={verification_code}"
        msg.html = f"<p>Please click the following link or copy and paste into your browser's address bar to verify your account.</p><p>If the verification code has expired, please complete the sign up process again to generate another code.</p><p>{verification_url}</p>"
        mail.send(msg)
        return "email sent successfully", 200


class VerifyAccount(Resource):
    def get(self):
        """
        Verify the verification code is correct and then commit the new User to the db
        """
        schema = VerifyAccountSchema()
        try:
            args = schema.load(request.args)
        except ValidationError as err:
            return err.messages, 400

        account_verification = AccountVerification.query.get(args["verification_code"])
        if not account_verification:
            clear_expired_verification_codes()
            return "Invalid verification code", 400

        if account_verification.expires < datetime.now().timestamp():
            clear_expired_verification_codes()
            return "Verification code already expired", 400

        user = pickle.loads(account_verification.user_obj)
        db.session.add(user)
        db.session.delete(account_verification)
        db.session.commit()

        return (
            f"Account verification successful! Please go to {os.getenv('BASE_URL', 'http://127.0.0.1:5000')} to sign in to your account.",
            200,
        )


class Login(Resource):
    def post(self):
        schema = LoginSchema()
        try:
            req = schema.load(request.get_json())
        except ValidationError as err:
            return err.messages, 400

        user = User.query.get(req["email"].lower())
        if not user:
            logger.info("user not found")
            return "user not found", 400
        elif not check_password_hash(user.password, req["password"]):
            logger.info("wrong password")
            return "incorrect password", 400

        access_token = create_access_token(identity=user.get_id(), expires_delta=timedelta(minutes=10.0))
        refresh_token = create_refresh_token(identity=user.get_id(), expires_delta=timedelta(days=90.0))

        use_cookie = request.headers.get("X-Auth-Method") == "Cookie"
        if use_cookie:
            resp = jsonify(login=True, name=user.name)
            set_access_cookies(resp, access_token)
            set_refresh_cookies(resp, refresh_token)
            return resp

        return jsonify(access_token=access_token, refresh_token=refresh_token, name=user.name)


class RefreshToken(Resource):
    @jwt_required(refresh=True)
    def post(self):
        email = get_jwt_identity()
        user = User.query.get(email)
        access_token = create_access_token(identity=user.get_id(), expires_delta=timedelta(minutes=10.0))
        use_cookie = request.headers.get("X-Auth-Method") == "Cookie"
        if use_cookie:
            resp = jsonify(token_refreshed=True)
            set_access_cookies(resp, access_token)
            return resp
        return jsonify(access_token=access_token)


class TokenIsValid(Resource):
    @jwt_required()
    def get(self):
        return jsonify(valid=True)


class Logout(Resource):
    def post(self):
        resp = jsonify(logout=True)
        unset_jwt_cookies(resp)
        return resp

