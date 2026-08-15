import asyncio
import logging
import requests
from src.config.environment import settings

logger = logging.getLogger(__name__)


async def send_email_mailersend(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str,
    to_name: str = "User",
) -> bool:
    """Gửi email qua MailerSend API sử dụng MAILERSEND_API_KEY từ file .env."""
    api_key = settings.MAILERSEND_API_KEY.strip()
    if not api_key:
        logger.warning("Chưa cấu hình MAILERSEND_API_KEY trong file .env. Email sẽ không được gửi thực tế.")
        return False

    sender_email = settings.MAIL_FROM_EMAIL.split("#")[0].strip()
    sender_name = settings.MAIL_FROM_NAME.split("#")[0].strip().replace('"', '')

    url = "https://api.mailersend.com/v1/email"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    payload = {
        "from": {
            "email": sender_email,
            "name": sender_name,
        },
        "to": [
            {
                "email": to_email.strip(),
                "name": to_name.strip(),
            }
        ],
        "subject": subject,
        "html": html_content,
        "text": text_content,
    }

    try:
        response = await asyncio.to_thread(
            requests.post,
            url,
            headers=headers,
            json=payload,
            timeout=10,
        )
        if response.status_code in [200, 202]:
            logger.info("Đã gửi email thành công tới %s qua MailerSend!", to_email)
            return True
        else:
            logger.error("MailerSend phản hồi lỗi status %s: %s", response.status_code, response.text)
            return False
    except Exception as e:
        logger.exception("Ngoại lệ khi gửi email tới %s qua MailerSend: %s", to_email, str(e))
        return False


async def send_otp_email(to_email: str, otp_code: str, user_name: str = "Sinh viên") -> bool:
    """Gửi email chứa mã xác thực OTP 6 số."""
    subject = f"[{otp_code}] Mã xác thực OTP đăng ký tài khoản AI Tutor"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #2F6FED; text-align: center; margin-top: 0;">AI Tutor System</h2>
        <p style="font-size: 15px; color: #1a2233;">Xin chào <strong>{user_name}</strong>,</p>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Cảm ơn bạn đã đăng ký tài khoản tại <strong>AI Tutor</strong>. Dưới đây là mã xác thực OTP của bạn:</p>
        <div style="background-color: #f0f5ff; text-align: center; padding: 18px; border-radius: 10px; margin: 24px 0; border: 1px dashed #2F6FED;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2F6FED;">{otp_code}</span>
        </div>
        <p style="font-size: 13px; color: #718096; line-height: 1.5;">Mã OTP có hiệu lực ngay lập tức. Vui lòng nhập mã này vào ứng dụng để kích hoạt tài khoản. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #edf2f7; margin: 24px 0;" />
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">Đây là email tự động, vui lòng không phản hồi.<br/>© 2026 AI Tutor Team</p>
    </div>
    """
    text_content = f"Xin chào {user_name}, mã OTP xác thực tài khoản AI Tutor của bạn là: {otp_code}."
    return await send_email_mailersend(to_email, subject, html_content, text_content, to_name=user_name)


async def send_reset_password_email(to_email: str, reset_token: str, user_name: str = "Người dùng") -> bool:
    """Gửi email chứa mã đặt lại mật khẩu."""
    subject = f"[{reset_token}] Mã đặt lại mật khẩu tài khoản AI Tutor"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #2F6FED; text-align: center; margin-top: 0;">AI Tutor System</h2>
        <p style="font-size: 15px; color: #1a2233;">Xin chào <strong>{user_name}</strong>,</p>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>{to_email}</strong>.</p>
        <div style="background-color: #fffbe6; text-align: center; padding: 18px; border-radius: 10px; margin: 24px 0; border: 1px dashed #ffe58f;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #d46b08;">{reset_token}</span>
        </div>
        <p style="font-size: 13px; color: #718096; line-height: 1.5;">Mã này có hiệu lực trong 15 phút. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.</p>
        <hr style="border: none; border-top: 1px solid #edf2f7; margin: 24px 0;" />
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">Đây là email tự động, vui lòng không phản hồi.<br/>© 2026 AI Tutor Team</p>
    </div>
    """
    text_content = f"Xin chào {user_name}, mã đặt lại mật khẩu của bạn là: {reset_token} (Hiệu lực 15 phút)."
    return await send_email_mailersend(to_email, subject, html_content, text_content, to_name=user_name)
