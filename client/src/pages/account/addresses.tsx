import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, MapPin, Home, Plus, Edit, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Define address type to fix TypeScript errors
interface Address {
  id: number;
  name: string;
  fullName: string;
  mobileNumber: string;
  pincode: string;
  houseNumber: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  type: string;
  isDefault: boolean;
}

const AddressesPage = () => {
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [addressName, setAddressName] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [pincode, setPincode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [addressType, setAddressType] = useState("home");
  const [isDefault, setIsDefault] = useState(false);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Sample data - would be replaced with real data from API
  useEffect(() => {
    // Simulating address fetch
    if (currentUser) {
      setAddresses([
        {
          id: 1,
          name: "Home",
          fullName: "John Doe",
          mobileNumber: "9876543210",
          pincode: "560001",
          houseNumber: "Apt 202",
          street: "MG Road",
          landmark: "Near Central Park",
          city: "Bangalore",
          state: "Karnataka",
          type: "home",
          isDefault: true
        },
        {
          id: 2,
          name: "Office",
          fullName: "John Doe",
          mobileNumber: "9876543210",
          pincode: "560002",
          houseNumber: "3rd Floor",
          street: "Tech Park",
          landmark: "IT Hub",
          city: "Bangalore",
          state: "Karnataka",
          type: "work",
          isDefault: false
        }
      ]);
    }
  }, [currentUser]);

  const resetForm = () => {
    setAddressName("");
    setFullName("");
    setMobileNumber("");
    setPincode("");
    setHouseNumber("");
    setStreet("");
    setLandmark("");
    setCity("");
    setState("");
    setAddressType("home");
    setIsDefault(false);
  };

  const handleAddAddress = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      // This would be replaced with an API call
      const newAddress = {
        id: Date.now(),
        name: addressName,
        fullName,
        mobileNumber,
        pincode,
        houseNumber,
        street,
        landmark,
        city,
        state,
        type: addressType,
        isDefault
      };
      
      setAddresses(prev => {
        // If new address is default, remove default from others
        if (isDefault) {
          return [
            ...prev.map(addr => ({ ...addr, isDefault: false })),
            newAddress
          ];
        }
        
        return [...prev, newAddress];
      });
      
      setShowAddForm(false);
      resetForm();
      toast({
        title: "Address added",
        description: "Your address has been added successfully.",
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleRemoveAddress = (id: number) => {
    setAddresses(prev => prev.filter(address => address.id !== id));
    toast({
      title: "Address removed",
      description: "Your address has been removed successfully.",
    });
  };

  const handleSetDefault = (id: number) => {
    setAddresses(prev => 
      prev.map(address => ({
        ...address,
        isDefault: address.id === id
      }))
    );
    toast({
      title: "Default address updated",
      description: "Your default address has been updated.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Your Addresses - Loudfits</title>
        <meta 
          name="description" 
          content="Manage your delivery addresses for faster checkout on Loudfits."
        />
      </Helmet>
      
      <div className="max-w-2xl mx-auto py-4 px-4 md:py-8">
        {/* Mobile back button */}
        <button 
          onClick={() => navigate("/account")}
          className="flex items-center text-gray-600 mb-4 md:hidden"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Back to Account</span>
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Addresses</h1>
          {!showAddForm && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Address
            </Button>
          )}
        </div>
        
        {currentUser ? (
          <>
            {showAddForm ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="p-5">
                  <h2 className="text-lg font-semibold mb-4">Add New Address</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="addressName">Address Name</Label>
                        <Input
                          id="addressName"
                          value={addressName}
                          onChange={(e) => setAddressName(e.target.value)}
                          placeholder="e.g. Home, Office"
                          className="bg-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter recipient's name"
                          className="bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobileNumber">Mobile Number</Label>
                        <Input
                          id="mobileNumber"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="bg-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="6-digit pincode"
                          className="bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="houseNumber">Flat, House No., Building, Company</Label>
                      <Input
                        id="houseNumber"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        placeholder="House/Apartment number"
                        className="bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="street">Area, Street, Sector, Village</Label>
                      <Input
                        id="street"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Street address"
                        className="bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="landmark">Landmark</Label>
                      <Input
                        id="landmark"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="E.g. near Apollo hospital"
                        className="bg-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Town/City</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City name"
                          className="bg-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State name"
                          className="bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="block mb-2">Address Type</Label>
                      <div className="flex space-x-3">
                        <div 
                          onClick={() => setAddressType('home')}
                          className={`flex items-center border ${
                            addressType === 'home' 
                              ? 'border-[#582A34] bg-[#582A34]/5' 
                              : 'border-gray-200'
                          } rounded-md px-3 py-2 cursor-pointer`}
                        >
                          <Home className={`h-4 w-4 mr-2 ${
                            addressType === 'home' ? 'text-[#582A34]' : 'text-gray-400'
                          }`} />
                          <span className={addressType === 'home' ? 'text-[#582A34]' : ''}>Home</span>
                        </div>
                        
                        <div 
                          onClick={() => setAddressType('work')}
                          className={`flex items-center border ${
                            addressType === 'work' 
                              ? 'border-[#582A34] bg-[#582A34]/5' 
                              : 'border-gray-200'
                          } rounded-md px-3 py-2 cursor-pointer`}
                        >
                          <MapPin className={`h-4 w-4 mr-2 ${
                            addressType === 'work' ? 'text-[#582A34]' : 'text-gray-400'
                          }`} />
                          <span className={addressType === 'work' ? 'text-[#582A34]' : ''}>Work</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="rounded border-gray-300 text-[#582A34] focus:ring-[#582A34]"
                      />
                      <Label htmlFor="isDefault" className="cursor-pointer">Make this my default address</Label>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 p-5 flex flex-col xs:flex-row space-y-3 xs:space-y-0 xs:space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="w-full xs:w-auto order-2 xs:order-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddAddress} 
                    disabled={isLoading || !fullName || !mobileNumber || !pincode || !houseNumber || !street || !city || !state}
                    className="w-full xs:w-auto order-1 xs:order-2"
                  >
                    {isLoading ? "Adding..." : "Add Address"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {addresses.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No addresses found</h3>
                    <p className="text-gray-500 mb-4">You don't have any addresses saved yet</p>
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add New Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <Card key={address.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex justify-between items-start p-4">
                            <div className="flex gap-3">
                              <div className="mt-1">
                                {address.type === 'home' ? (
                                  <Home className="h-5 w-5 text-[#582A34]" />
                                ) : (
                                  <MapPin className="h-5 w-5 text-[#582A34]" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{address.name}</h3>
                                  {address.isDefault && (
                                    <span className="bg-[#582A34]/10 text-[#582A34] text-xs px-2 py-0.5 rounded">
                                      Default
                                    </span>
                                  )}
                                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded capitalize">
                                    {address.type}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{address.fullName}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {address.houseNumber}, {address.street}
                                  {address.landmark && `, ${address.landmark}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {address.city}, {address.state}, {address.pincode}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Mobile: {address.mobileNumber}
                                </p>
                                
                                <div className="flex gap-4 mt-3">
                                  <button
                                    onClick={() => {/* Handle edit */}}
                                    className="text-sm text-gray-600 hover:text-[#582A34] flex items-center"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleRemoveAddress(address.id)}
                                    className="text-sm text-gray-600 hover:text-red-600 flex items-center"
                                  >
                                    <Trash className="h-3 w-3 mr-1" />
                                    Remove
                                  </button>
                                  {!address.isDefault && (
                                    <button
                                      onClick={() => handleSetDefault(address.id)}
                                      className="text-sm text-[#582A34] flex items-center"
                                    >
                                      Set as default
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#582A34] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading account information...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AddressesPage;