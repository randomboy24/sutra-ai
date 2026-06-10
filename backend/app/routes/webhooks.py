import os

from fastapi import APIRouter, Request, HTTPException
from svix.webhooks import Webhook, WebhookVerificationError

from app.database import SessionLocal
from app.models.user import User
from app.models.student import Student


router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/clerk")
async def clerk_webhook(request: Request):
    payload = await request.body()
    headers = request.headers

    try:
        event = Webhook(
            os.environ["CLERK_WEBHOOK_SECRET"]
        ).verify(payload, headers)
    except WebhookVerificationError:
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook signature",
        )

    event_type = event["type"]

    if event_type != "user.created":
        return {"success": True}

    data = event["data"]

    clerk_user_id = data["id"]

    email_addresses = data.get("email_addresses", [])
    email = email_addresses[0]["email_address"] if email_addresses else None

    metadata = data.get("unsafe_metadata", {})

    role = metadata.get("role", "student")
    student_type = metadata.get("student_type", "individual")
    class_level = metadata.get("class_level")
    board = metadata.get("board")
    stream = metadata.get("stream")
    science_group = metadata.get("science_group")
    onboarding_complete = metadata.get("onboarding_complete", False)

    db = SessionLocal()

    try:
        existing_user = (
            db.query(User)
            .filter(User.clerk_user_id == clerk_user_id)
            .first()
        )

        if existing_user:
            return {"success": True, "message": "User already exists"}

        user = User(
            clerk_user_id=clerk_user_id,
            email=email,
            role=role,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        if role == "student":
            student = Student(
                user_id=user.id,
                full_name=data.get("first_name") or "New Student",
                is_individual=student_type == "individual",
                class_level=class_level,
                board=board,
                stream=stream,
                science_group=science_group,
                onboarding_complete=bool(onboarding_complete),
            )

            db.add(student)
            db.commit()

        return {"success": True}

    except Exception as e:
        db.rollback()
        print("Webhook error:", e)
        raise HTTPException(
            status_code=500,
            detail="Webhook processing failed",
        )

    finally:
        db.close()