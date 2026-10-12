import unittest

from fastapi import HTTPException

from core.dependencies import get_current_user, require_admin, require_staff
from core.security import create_access_token


class AccessControlTests(unittest.TestCase):
    def test_staff_guard_accepts_staff_role(self):
        user = {"role": "staff"}
        self.assertIs(require_staff(user), user)

    def test_staff_guard_accepts_waiter_role(self):
        user = {"role": "waiter"}
        self.assertIs(require_staff(user), user)

    def test_staff_guard_rejects_customer(self):
        with self.assertRaisesRegex(HTTPException, "Staff only") as context:
            require_staff({"role": "regular_customer"})
        self.assertEqual(context.exception.status_code, 403)

    def test_admin_guard_accepts_admin_role(self):
        user = {"role": "admin"}
        self.assertIs(require_admin(user), user)

    def test_admin_guard_rejects_staff(self):
        with self.assertRaisesRegex(HTTPException, "Admin only") as context:
            require_admin({"role": "waiter"})
        self.assertEqual(context.exception.status_code, 403)

    def test_current_user_decodes_signed_token(self):
        token = create_access_token({"sub": 42, "role": "admin"})
        payload = get_current_user(token)
        self.assertEqual(payload["sub"], "42")
        self.assertEqual(payload["role"], "admin")

    def test_current_user_rejects_invalid_token(self):
        with self.assertRaisesRegex(HTTPException, "Invalid token") as context:
            get_current_user("not-a-jwt")
        self.assertEqual(context.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
