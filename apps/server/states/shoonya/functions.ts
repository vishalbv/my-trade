import axios from "axios";

interface ValidateRefreshTokenResponse {
  s: string;
  code: number;
  message: string;
  access_token: string;
}

export const validateRefreshToken = async (
  appIdHash: string,
  refreshToken: string,
  pin: string
): Promise<ValidateRefreshTokenResponse> => {
  const url = "https://api-t1.fyers.in/api/v3/validate-refresh-token";
  const data = {
    grant_type: "refresh_token",
    appIdHash,
    refresh_token: refreshToken,
    pin,
  };

  try {
    const response = await axios.post<ValidateRefreshTokenResponse>(url, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Fyers API error: ${error.response.data.message || error.message}`
      );
    }
    throw error;
  }
};
