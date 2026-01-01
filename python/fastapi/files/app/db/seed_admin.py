from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models.user import User
from app.core.config import settings
from app.core.security import hash_password, verify_password

def seed_admin() -> None:
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        return

    db: Session = SessionLocal()

    user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()

    if user:
        if not verify_password(settings.ADMIN_PASSWORD, user.hashed_password):
            user.hashed_password = hash_password(settings.ADMIN_PASSWORD)
            db.commit()
        db.close()
        return

    admin = User(
        email=settings.ADMIN_EMAIL,
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.close()