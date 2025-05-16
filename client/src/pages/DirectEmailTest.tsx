import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import our direct email testing utility
import { sendDirectTestEmail } from "@/lib/directEmailTest";

const DirectEmailTest: React.FC = () => {
  const { toast } = useToast();
  const [to, setTo] = useState<string>('');
  const [subject, setSubject] = useState<string>('Test Email from Loudfits');
  const [message, setMessage] = useState<string>('This is a test email from the Loudfits application.');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{success: boolean, message: string, messageId?: string} | null>(null);

  // Handle sending test email
  const sendTestEmail = async () => {    
    if (!to) {
      toast({
        title: "Missing email address",
        description: "Please enter a recipient email address",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setLastResult(null);
    
    try {
      const result = await sendDirectTestEmail(to, subject, message);
      
      if (result.success) {
        toast({
          title: "Email sent successfully",
          description: `Email sent to ${to}`,
          variant: "default"
        });
        
        setLastResult({
          success: true,
          message: result.message,
          messageId: result.messageId
        });
      } else {
        toast({
          title: "Failed to send email",
          description: result.message,
          variant: "destructive"
        });
        
        setLastResult({
          success: false,
          message: result.message
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
      
      setLastResult({
        success: false,
        message: error.message || 'An error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Direct Email Test</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send Direct Test Email</CardTitle>
              <CardDescription>
                Use this simplified tool to test email delivery directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="to">Recipient Email</Label>
                  <Input
                    id="to"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="Enter recipient email address"
                    type="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter email message"
                    rows={5}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={sendTestEmail} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>
                Latest test email result
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastResult ? (
                <Alert variant={lastResult.success ? "default" : "destructive"}>
                  <div className="flex items-start">
                    {lastResult.success ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2" />
                    )}
                    <div>
                      <AlertTitle>{lastResult.success ? "Email Sent" : "Failed"}</AlertTitle>
                      <AlertDescription>
                        {lastResult.message}
                        {lastResult.messageId && (
                          <div className="mt-2 text-xs">
                            Message ID: {lastResult.messageId}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>No emails sent yet</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>This is a simplified email tester</strong> that bypasses the main email system for direct testing. It only uses the Gmail transport.
                </p>
                <p>
                  <strong>Recipient Email:</strong> Enter a valid email address to receive the test message.
                </p>
                <p>
                  <strong>Message ID:</strong> If successful, you'll see a Message ID which confirms the email was accepted by Gmail for delivery.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DirectEmailTest;