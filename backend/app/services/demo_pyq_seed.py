import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.mock_exam import (
    MockAttemptAnswer,
    Question,
    QuestionOption,
    QuestionSource,
)


PARSED_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "pyq" / "parsed"


def seed_demo_pyq_data(db: Session, data_dir: Path = PARSED_DATA_DIR) -> dict[str, int]:
    files = sorted(data_dir.glob("*.json"))
    sources_created = 0
    questions_created = 0
    questions_updated = 0

    for file_path in files:
        payload = json.loads(file_path.read_text())
        metadata = payload["metadata"]

        source = (
            db.query(QuestionSource)
            .filter(QuestionSource.source_name == metadata["source_name"])
            .first()
        )

        if not source:
            source = QuestionSource(
                board=metadata["board"],
                class_level=metadata["class_level"],
                stream=metadata.get("stream"),
                subject=metadata["subject"],
                source_type=metadata["source_type"],
                source_name=metadata["source_name"],
                source_file=metadata.get("source_file"),
            )
            db.add(source)
            db.flush()
            sources_created += 1

        for item in payload.get("questions", []):
            question = (
                db.query(Question)
                .filter(
                    Question.source_id == source.id,
                    Question.question_number == str(item["question_number"]),
                )
                .first()
            )

            fields = {
                "board": metadata["board"],
                "class_level": metadata["class_level"],
                "stream": metadata.get("stream"),
                "subject": metadata["subject"],
                "chapter": item["chapter"],
                "unit": item["unit"],
                "question_type": item.get("question_type", "theory"),
                "text": item["text"],
                "expected_answer": item.get("expected_answer"),
                "marks": item.get("marks", 1),
                "difficulty": item.get("difficulty", "Medium"),
                "frequency_score": item.get("frequency_score", 0),
                "importance_score": item.get("importance_score", 0),
                "source_year": item.get("source_year"),
                "is_active": True,
            }

            if question:
                for key, value in fields.items():
                    setattr(question, key, value)
                questions_updated += 1
            else:
                question = Question(
                    source_id=source.id,
                    question_number=str(item["question_number"]),
                    **fields,
                )
                db.add(question)
                db.flush()
                questions_created += 1

            if item.get("options"):
                _replace_options(db, question, item["options"])

    db.commit()

    return {
        "files_processed": len(files),
        "sources_created": sources_created,
        "questions_created": questions_created,
        "questions_updated": questions_updated,
    }


def _replace_options(db: Session, question: Question, options: list[dict]) -> None:
    db.query(MockAttemptAnswer).filter(
        MockAttemptAnswer.selected_option_id == QuestionOption.id,
        QuestionOption.question_id == question.id,
    ).update({"selected_option_id": None}, synchronize_session="fetch")
    db.flush()
    db.query(QuestionOption).filter(QuestionOption.question_id == question.id).delete()

    for index, option in enumerate(options):
        db.add(
            QuestionOption(
                question_id=question.id,
                label=option.get("label", chr(65 + index)),
                text=option["text"],
                is_correct=option.get("is_correct", False),
                display_order=option.get("display_order", index),
            )
        )
