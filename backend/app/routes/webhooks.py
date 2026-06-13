import os

from fastapi import APIRouter, Request, HTTPException
from svix.webhooks import Webhook, WebhookVerificationError

from app.database import SessionLocal
from app.models.user import User
from app.models.student import Student


router = APIRouter(prefix="/webhooks", tags=["webhooks"])


CLASS_LEVELS = {"10th", "12th"}
BOARDS = {"CBSE"}
STREAMS = {"science", "commerce"}
SCIENCE_GROUPS = {"pcb", "pcm", "pcmb"}


def is_student_onboarding_complete(
    student_type: str,
    class_level: str | None,
    board: str | None,
    stream: str | None,
    science_group: str | None,
) -> bool:
    if student_type != "individual":
        return False

    if class_level not in CLASS_LEVELS or board not in BOARDS:
        return False

    if stream not in STREAMS:
        return False

    if stream == "commerce":
        return True

    return science_group in SCIENCE_GROUPS


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

    if stream != "science":
        science_group = None

    onboarding_complete = is_student_onboarding_complete(
        student_type=student_type,
        class_level=class_level,
        board=board,
        stream=stream,
        science_group=science_group,
    )

    db = SessionLocal()

    try:
        existing_user = (
            db.query(User)
            .filter(User.clerk_user_id == clerk_user_id)
            .first()
        )

        user = existing_user or User(
            clerk_user_id=clerk_user_id,
            email=email,
            role=role,
        )

        if not existing_user:
            db.add(user)
            db.flush()

        if role == "student":
            existing_student = (
                db.query(Student)
                .filter(Student.user_id == user.id)
                .first()
            )

            if not existing_student:
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