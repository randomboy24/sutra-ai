from uuid import uuid4

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4())
    )

    clerk_user_id: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    email: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    role: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    student = relationship(
        "Student",
        back_populates="user",
        uselist=False
    )