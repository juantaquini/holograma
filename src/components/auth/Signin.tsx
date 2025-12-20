"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/(providers)/auth-provider";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import styles from "./AuthForm.module.css";
import googleLogo from "@/assets/google_logo.svg";
import Image from "next/image";
import CustomTextInput from "@/components/inputs/CustomTextInput";

interface SigninProps {
  isPopup?: boolean;
  onClose?: () => void;
  onOpenLogin?: () => void;
}

interface SigninForm {
  Email: string;
  Password: string;
  ConfirmPassword: string;
}

const Signin: React.FC<SigninProps> = ({
  isPopup = false,
  onClose,
  onOpenLogin,
}) => {
  const auth = useAuth();
  const router = useRouter();

  if (!auth) {
    throw new Error("Signin must be used inside AuthContextProvider");
  }

  const { googleSignIn, emailSignUp } = auth;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SigninForm>({
    defaultValues: {
      Email: "",
      Password: "",
      ConfirmPassword: "",
    },
  });

  const passwordValue = watch("Password");

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");

      const result = await googleSignIn();

      onClose?.();
      router.push("/interactives");
    } catch {
      setError("Google sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SigninForm) => {
    if (data.Password !== data.ConfirmPassword) {
      setError("Passwords must match.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      await emailSignUp(data.Email, data.Password);

      onClose?.();
      router.push("/dashboard");
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const Content = (
    <div className={styles["Auth-modal-container"]}>
      {isLoading && (
        <div className={styles["Auth-modal-loading"]}>
          Loading...
        </div>
      )}

      <div className={styles["Auth-modal-header"]}>
        <p className={styles["Auth-modal-logo"]}>HOLOGRAMA</p>
        <h2 className={styles["Auth-modal-title"]}>
          Create your account
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

          <CustomTextInput
            name="Password"
            register={register}
            label="Password"
            placeholder="Enter your password"
            error={errors.Password}
            type="password"
          />

          <CustomTextInput
            name="ConfirmPassword"
            register={register}
            label="Confirm password"
            placeholder="Confirm your password"
            error={errors.ConfirmPassword}
            type="password"
          />
        </div>

        <div className={styles["Auth-modal-auth-buttons"]}>
          <button
            type="submit"
            className={styles["Auth-modal-btn-primary"]}
          >
            Sign up
          </button>

          <div className={styles["Auth-modal-divider"]}>OR</div>

          <button
            type="button"
            className={styles["Auth-modal-btn-google"]}
            onClick={handleGoogleSignIn}
          >
            <Image src={googleLogo} alt="Google" />
            Continue with Google
          </button>

          <p className={styles["Auth-modal-signup-text"]}>
            Already have an account?{" "}
            <a
              href="#"
              className={styles["Auth-modal-link"]}
              onClick={(e) => {
                e.preventDefault();
                onOpenLogin?.();
              }}
            >
              Log in
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

export default Signin;
