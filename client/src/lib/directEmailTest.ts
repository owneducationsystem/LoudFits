import { apiRequest } from "./queryClient";

/**
 * Send a direct email for testing purposes
 * This bypasses the main email service for simple testing
 */
export async function sendDirectTestEmail(
  to: string,
  subject: string,
  message: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  try {
    const response = await apiRequest("POST", "/api/direct-email/test-direct-email", {
      to,
      subject,
      message
    });
    
    const result = await response.json();
    
    return {
      success: result.success,
      message: result.message,
      messageId: result.messageId
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to send test email"
    };
  }
}