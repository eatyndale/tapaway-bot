import { useState } from "react";
import { Phone, AlertTriangle, Heart, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CrisisSupportProps {
  onClose?: () => void;
  onSupportContacted?: () => void;
}

const CrisisSupport = ({ onClose, onSupportContacted }: CrisisSupportProps) => {
  const [callInitiated, setCallInitiated] = useState<string | null>(null);

  const emergencyContacts = [
    {
      name: "Emergency Services",
      number: "911",
      description: "Immediate emergency assistance",
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      priority: "immediate"
    },
    {
      name: "National Suicide Prevention Lifeline",
      number: "988",
      description: "24/7 crisis support and suicide prevention",
      icon: <Heart className="w-5 h-5 text-pink-500" />,
      priority: "crisis"
    },
    {
      name: "Crisis Text Line",
      number: "741741",
      description: "Text HOME to 741741 for crisis support",
      icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
      priority: "crisis",
      isText: true
    },
    {
      name: "SAMHSA National Helpline",
      number: "1-800-662-4357",
      description: "Mental health and substance abuse treatment referral",
      icon: <Phone className="w-5 h-5 text-green-500" />,
      priority: "support"
    },
    {
      name: "Find a Therapist (UK)",
      number: "https://www.psychotherapy.org.uk/",
      description: "Directory of qualified therapists",
      icon: <Phone className="w-5 h-5 text-purple-500" />,
      priority: "support",
      isUrl: true
    }
  ];

  const handleCall = (number: string, name: string, isText?: boolean, isUrl?: boolean) => {
    setCallInitiated(name);
    
    if (isUrl) {
      // For URLs, open in new tab
      window.open(number, '_blank');
    } else if (isText) {
      // For text services, open SMS app
      window.location.href = `sms:${number}?body=HOME`;
    } else {
      // For calls, use tel: protocol
      window.location.href = `tel:${number}`;
    }
    
    // Reset after 3 seconds
    setTimeout(() => setCallInitiated(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-2" />
            <CardTitle className="text-xl text-red-600">Crisis Support Resources</CardTitle>
          </div>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              <strong>You are not alone.</strong> Help is available 24/7. If this was triggered by mistake, you can continue your session below. Otherwise, please reach out for immediate support.
            </AlertDescription>
          </Alert>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {emergencyContacts.map((contact, index) => (
            <Card 
              key={index} 
              className={`transition-all duration-200 hover:shadow-md ${
                contact.priority === 'immediate' ? 'border-red-300 bg-red-50' :
                contact.priority === 'crisis' ? 'border-orange-300 bg-orange-50' :
                'border-green-300 bg-green-50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {contact.icon}
                    <div>
                      <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-600">{contact.description}</p>
                      <p className="text-lg font-mono font-bold text-gray-800">{contact.number}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCall(contact.number, contact.name, contact.isText, contact.isUrl)}
                    className={`ml-4 ${
                      contact.priority === 'immediate' ? 'bg-red-600 hover:bg-red-700' :
                      contact.priority === 'crisis' ? 'bg-orange-600 hover:bg-orange-700' :
                      'bg-green-600 hover:bg-green-700'
                    } text-white`}
                    disabled={callInitiated === contact.name}
                  >
                    {callInitiated === contact.name ? (
                      "Connecting..."
                    ) : (
                      <>
                        {contact.isText ? <MessageCircle className="w-4 h-4 mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                        {contact.isUrl ? "Visit" : contact.isText ? "Text" : "Call"} Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Alert className="border-blue-200 bg-blue-50 mt-6">
            <Heart className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700">
              <strong>Remember:</strong> You are valued and your life matters. These feelings are temporary, but help is permanent. 
              Reaching out is a sign of strength, not weakness.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center gap-4 mt-6">
            {onClose && (
              <>
                <Button variant="outline" onClick={onClose} className="px-6">
                  This was triggered by mistake - Continue Session
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    // Log that user acknowledged but chose to continue
                    console.log('User acknowledged crisis resources and chose to continue');
                    onClose();
                  }}
                  className="px-6"
                >
                  I understand - Continue Session
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrisisSupport;