import { getSupabaseClient, getSupabaseSession } from "@/lib/supabaseClient";
import { apiRequest } from "@/services/api";

export async function signupUser(payload) {
  const phoneNumber = payload.phoneNumber.replace(/\D/g, "");
  const availability = await checkPhoneNumberAvailability(phoneNumber);
  if (!availability.available) {
    throw new Error("This mobile number is already associated with another account.");
  }

  const { data, error } = await getSupabaseClient().auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        display_name: payload.name,
        date_of_birth: payload.dateOfBirth,
        dateOfBirth: payload.dateOfBirth,
        full_name: payload.name,
        name: payload.name,
        phone_number: phoneNumber,
        phoneNumber,
        profile_completed: true,
        country: "India",
        timezone: "Asia/Kolkata",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const { error: signOutError } = await getSupabaseClient().auth.signOut({ scope: "local" });
  if (signOutError) {
    throw new Error("Account created, but the signup session could not be cleared. Please log in again.");
  }

  return {
    message: "Account created. Please log in.",
    user: data.user ? mapSupabaseUser(data.user, false) : null,
  };
}

export function checkPhoneNumberAvailability(phoneNumber) {
  return apiRequest("/profile/phone-availability?phoneNumber=" + encodeURIComponent(phoneNumber), {
    auth: false,
  });
}

export async function loginUser(payload) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session?.access_token) {
    throw new Error("The authentication service did not return a valid session.");
  }

  return getCurrentUser();
}

export async function logoutUser() {
  const { error } = await getSupabaseClient().auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  const session = await getSupabaseSession();
  if (!session) {
    throw new Error("Authentication required.");
  }

  return apiRequest("/auth/me");
}

export function subscribeToAuthChanges(callback) {
  const {
    data: { subscription },
  } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
    callback(session, event);
  });

  return () => subscription.unsubscribe();
}

function mapSupabaseUser(user, isLoggedIn) {
  const metadata = user.user_metadata || {};
  const email = user.email || "";

  return {
    accountId: "",
    email,
    id: user.id,
    isLoggedIn,
    name: metadata.full_name || metadata.name || metadata.display_name || email.split("@")[0],
    phoneNumber: metadata.phone_number || metadata.phoneNumber || "",
    dateOfBirth: metadata.date_of_birth || metadata.dateOfBirth || "",
    timezone: metadata.timezone || "Asia/Kolkata",
    country: metadata.country || "India",
    lastLoginAt: "",
    lastLoginLabel: "",
    loginBadge: null,
    joiningBonusAmount: 0,
    joiningBonusCredited: false,
    joiningBonusMessage: "",
    profileCompleted: Boolean(metadata.profile_completed || metadata.profileCompleted),
    createdAt: "",
    role: "USER",
    status: "ACTIVE",
  };
}
