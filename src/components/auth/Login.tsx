"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/(providers)/auth-provider";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import styles from "./AuthForm.module.css";
import googleLogo from "@/assets/google_logo.svg";
import CustomTextInput from "@/components/inputs/CustomTextInput";
import { post } from "@/api/http";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";
import type { User } from "firebase/auth";

interface LoginProps {
  isPopup?: boolean;
  onClose?: () => void;
  onOpenSignin?: () => void;
}

interface LoginForm {
  Email: string;
  Password: string;
}

const Login: React.FC<LoginProps> = ({
  isPopup = false,
  onClose,
  onOpenSignin,
}) => {
  const auth = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: { Email: "", Password: "" },
  });

  if (!auth) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  const { googleSignIn, emailLogin } = auth;

  const handleFirebaseAuth = async (firebaseUser: User) => {
    try {
      await post("/users/auth", {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      });
    } catch {
      setError("Failed to sync user.");
    }
  };

  const handleGoogleLogin = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const result = await googleSignIn();
      await handleFirebaseAuth(result.user);
      onClose?.();
    } catch {
      setError("Google sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await emailLogin(data.Email, data.Password);
      await handleFirebaseAuth(result.user);
      onClose?.();
      router.push("/interactives");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const Content = (
    <div className={styles["Auth-modal-container"]}>
      {isLoading && <LoadingSketch />}

      <div className={styles["Auth-modal-header"]}>
        <p className={styles["Auth-modal-logo"]}>HOLOGRAMA</p>
        <h2 className={styles["Auth-modal-header-title"]}>
          Welcome back
        </h2>
      </div>

      {error && (
        <div className={styles["Auth-modal-error"]}>{error}</div>
      )}

      <form
        className={styles["Auth-modal-form"]}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className={styles["Auth-modal-inputs"]}>
          <CustomTextInput
            name="Email"
            register={register}
            label="Email"
            placeholder="Enter your email"
            error={errors.Email}
            type="email"
          />

          <div className={styles["Auth-modal-password-field"]}>
            <CustomTextInput
              name="Password"
              register={register}
              label="Password"
              placeholder="Enter your password"
              error={errors.Password}
              type="password"
            />
            <Link
              href="/recover-password"
              className={styles["Auth-modal-forgot-link"]}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className={styles["Auth-modal-auth-buttons"]}>
          <button
            type="submit"
            className={styles["Auth-modal-btn-primary"]}
          >
            Log in
          </button>

          <div className={styles["Auth-modal-divider"]}>OR</div>

          <button
            type="button"
            className={styles["Auth-modal-btn-google"]}
            onClick={handleGoogleLogin}
          >
            <Image src={googleLogo} alt="Google" />
            Continue with Google
          </button>

          <p className={styles["Auth-modal-signup-text"]}>
            Don&apos;t have an account?{" "}
            <a
              href="#"
              className={styles["Auth-modal-link"]}
              onClick={(e) => {
                e.preventDefault();
                onOpenSignin?.();
              }}
            >
              Sign up
            </a>
          </p>
        </div>
      </form>
    </div>
  );

  return isPopup ? (
    Content
  ) : (
    <div className={styles["Auth-modal-overlay"]}>{Content}</div>
  );
};

export default Login;
