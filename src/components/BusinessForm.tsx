import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, Calendar, MapPin, Phone, Globe, Facebook, Music, DollarSign, Package, Camera, CreditCard, Plus, X } from "lucide-react";

interface BusinessFormData {
  name: string;
  description: string;
  category: string;
  phone: string;
  licenseExpiredDate: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;
  facebookPage: string;
  tiktokUrl: string;
  startingPrice: string;
  options: string[];
  productsCatalog: string[];
  onlineShopOption: string;
  paymentOption: string;
}

const BUSINESS_OPTIONS = [
  "Cash on Delivery",
  "Pickup In-Store", 
  "Digital Payments",
  "Next-Day Delivery"
];

const BUSINESS_CATEGORIES = [
  "Restaurant",
  "Retail Store",
  "Service Business",
  "Healthcare",
  "Beauty & Salon",
  "Technology",
  "Automotive",
  "Real Estate",
  "Education",
  "Entertainment",
  "Other"
];

const PREDEFINED_PRODUCTS = [
  "Espresso Latte",
  "Cappuccino",
  "Cold Brew",
  "Tea",
  "Pastries",
  "Sandwiches"
];

interface BusinessFormProps {
  onSuccess?: () => void;
}

export default function BusinessForm({ onSuccess }: BusinessFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [customProducts, setCustomProducts] = useState<string[]>([]);
  const [newProductName, setNewProductName] = useState("");
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: "",
    description: "",
    category: "",
    phone: "",
    licenseExpiredDate: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    website: "",
    facebookPage: "",
    tiktokUrl: "",
    startingPrice: "",
    options: [],
    productsCatalog: [],
    onlineShopOption: "sure",
    paymentOption: "stripe"
  });

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      options: checked 
        ? [...prev.options, option]
        : prev.options.filter(opt => opt !== option)
    }));
  };

  const handleProductChange = (product: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      productsCatalog: checked 
        ? [...prev.productsCatalog, product]
        : prev.productsCatalog.filter(p => p !== product)
    }));
  };

  const addCustomProduct = () => {
    if (newProductName.trim() && !customProducts.includes(newProductName.trim())) {
      const newProduct = newProductName.trim();
      setCustomProducts(prev => [...prev, newProduct]);
      setFormData(prev => ({
        ...prev,
        productsCatalog: [...prev.productsCatalog, newProduct]
      }));
      setNewProductName("");
    }
  };

  const removeCustomProduct = (product: string) => {
    setCustomProducts(prev => prev.filter(p => p !== product));
    setFormData(prev => ({
      ...prev,
      productsCatalog: prev.productsCatalog.filter(p => p !== product)
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 1 * 1024 * 1024; // 1MB in bytes
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Logo file must be smaller than 1MB. Please choose a smaller file.",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      setLogoFile(file);
    }
  };

  const handleProductImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const maxSize = 1 * 1024 * 1024; // 1MB in bytes
      const maxFiles = 3;
      
      // Check file count
      if (files.length > maxFiles) {
        toast({
          title: "Too Many Files",
          description: `You can only select up to ${maxFiles} images.`,
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Check file sizes
      const oversizedFiles = files.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        toast({
          title: "Files Too Large",
          description: `Each product image must be smaller than 1MB. ${oversizedFiles.length} file(s) exceed this limit.`,
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      setProductImages(files);
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 1 * 1024 * 1024; // 1MB in bytes
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Receipt file must be smaller than 1MB. Please choose a smaller file.",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      setReceiptFile(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to list your business.",
        variant: "destructive",
      });
      navigate('/auth/signin');
      return;
    }

    setLoading(true);

    try {
      let logoUrl = "";
      let imageUrls: string[] = [];
      let receiptUrl = "";

      // Upload logo if provided
      if (logoFile) {
        const logoPath = `logos/${user.id}/${Date.now()}_${logoFile.name}`;
        logoUrl = await uploadFile(logoFile, 'business-assets', logoPath);
      }

      // Upload product images if provided
      if (productImages.length > 0) {
        const uploadPromises = productImages.map((file, index) => {
          const imagePath = `products/${user.id}/${Date.now()}_${index}_${file.name}`;
          return uploadFile(file, 'business-assets', imagePath);
        });
        imageUrls = await Promise.all(uploadPromises);
      }

      // Upload receipt if bank payment option is selected
      if (formData.paymentOption === 'bank' && receiptFile) {
        const receiptPath = `receipts/${user.id}/${Date.now()}_${receiptFile.name}`;
        receiptUrl = await uploadFile(receiptFile, 'business-assets', receiptPath);
      }

      // Create business listing
      const { error } = await supabase
        .from('businesses')
        .insert({
          owner_id: user.id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          website: formData.website,
          image_url: logoUrl || null,
          facebook_page: formData.facebookPage || null,
          tiktok_url: formData.tiktokUrl || null,
          starting_price: formData.startingPrice || null,
          business_options: formData.options.length > 0 ? formData.options : null,
          products_catalog: formData.productsCatalog.length > 0 ? formData.productsCatalog.join(', ') : null,
          license_expired_date: formData.licenseExpiredDate || null,
          product_images: imageUrls.length > 0 ? imageUrls : null
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your business has been listed successfully.",
      });

      // Call onSuccess callback if provided, otherwise navigate to dashboard
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error listing business:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to list business. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your business name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Business Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your business, services, and what makes you unique..."
              rows={4}
              required
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Business Logo</Label>
            <div className="relative">
              <input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="sr-only"
              />
              <label
                htmlFor="logo"
                className="flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 cursor-pointer group"
              >
                <Upload className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
                <div className="text-center">
                  <p className="text-sm font-medium text-primary group-hover:text-primary/80">
                    Choose Logo File
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 1MB
                  </p>
                </div>
              </label>
            </div>
            {logoFile && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-700">Selected: {logoFile.name}</p>
              </div>
            )}
          </div>

          {/* Product Images */}
          <div className="space-y-2">
            <Label htmlFor="productImages">Product Images (Max 3)</Label>
            <div className="relative">
              <input
                id="productImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleProductImagesChange}
                className="sr-only"
              />
              <label
                htmlFor="productImages"
                className="flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 cursor-pointer group"
              >
                <Camera className="h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-700 group-hover:text-blue-800">
                    Choose Product Images
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Select up to 3 images (PNG, JPG, max 1MB each)
                  </p>
                </div>
              </label>
            </div>
            {productImages.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-700">
                  Selected: {productImages.length} image(s)
                </p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="licenseExpiredDate">License Expiration Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="licenseExpiredDate"
                  type="date"
                  value={formData.licenseExpiredDate}
                  onChange={(e) => handleInputChange('licenseExpiredDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label>Business Address</Label>
            </div>
            
            <div className="space-y-2">
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
              />
              <Input
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="State"
              />
              <Input
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="ZIP code"
              />
            </div>
          </div>

          {/* Online Presence */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="website">Website</Label>
                </div>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://your-website.com"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="facebookPage">Facebook Page</Label>
                </div>
                <Input
                  id="facebookPage"
                  value={formData.facebookPage}
                  onChange={(e) => handleInputChange('facebookPage', e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="tiktokUrl">TikTok</Label>
              </div>
              <Input
                id="tiktokUrl"
                value={formData.tiktokUrl}
                onChange={(e) => handleInputChange('tiktokUrl', e.target.value)}
                placeholder="https://tiktok.com/@yourusername"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="startingPrice">Starting Price</Label>
            </div>
            <Input
              id="startingPrice"
              value={formData.startingPrice}
              onChange={(e) => handleInputChange('startingPrice', e.target.value)}
              placeholder="$20, From $50, etc."
            />
          </div>

          {/* Business Options */}
          <div className="space-y-4">
            <Label>Business Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BUSINESS_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={formData.options.includes(option)}
                    onCheckedChange={(checked) => handleOptionChange(option, checked as boolean)}
                  />
                  <Label htmlFor={option} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Products Catalog */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <Label>Products/Services Catalog</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PREDEFINED_PRODUCTS.map((product) => (
                <div key={product} className="flex items-center space-x-2">
                  <Checkbox
                    id={product}
                    checked={formData.productsCatalog.includes(product)}
                    onCheckedChange={(checked) => handleProductChange(product, checked as boolean)}
                  />
                  <Label htmlFor={product} className="text-sm">
                    {product}
                  </Label>
                </div>
              ))}
            </div>

            {/* Custom Products */}
            <div className="space-y-2">
              <Label>Add Custom Products/Services</Label>
              <div className="flex gap-2">
                <Input
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Enter product/service name"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomProduct())}
                />
                <Button type="button" onClick={addCustomProduct} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {customProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customProducts.map((product) => (
                    <div key={product} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                      <span>{product}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomProduct(product)}
                        className="h-auto p-0 w-4 h-4 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Online Shop Question */}
          <div className="space-y-4">
            <Label>Would you like an online shop with your business listing?</Label>
            <RadioGroup
              value={formData.onlineShopOption}
              onValueChange={(value) => handleInputChange('onlineShopOption', value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sure" id="sure" />
                <Label htmlFor="sure">Sure, include online shop</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No, just the listing</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Options */}
          {formData.onlineShopOption === "sure" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <Label>Payment Processing</Label>
              </div>
              <RadioGroup
                value={formData.paymentOption}
                onValueChange={(value) => handleInputChange('paymentOption', value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <div className="space-y-1">
                    <Label htmlFor="stripe" className="font-medium">Stripe (Recommended)</Label>
                    <p className="text-sm text-muted-foreground">3% processing fee</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="bank" id="bank" />
                  <div className="space-y-1">
                    <Label htmlFor="bank" className="font-medium">Direct Bank Transfer</Label>
                    <p className="text-sm text-muted-foreground">No processing fees</p>
                  </div>
                </div>
              </RadioGroup>

              {/* Bank Receipt Upload */}
              {formData.paymentOption === "bank" && (
                <div className="space-y-2">
                  <Label htmlFor="receipt">Upload Bank Receipt ($2/year payment)</Label>
                  <div className="relative">
                    <input
                      id="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleReceiptChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="receipt"
                      className="flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50 hover:bg-orange-100 hover:border-orange-400 transition-all duration-200 cursor-pointer group"
                    >
                      <Upload className="h-6 w-6 text-orange-600 group-hover:text-orange-700 transition-colors" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-orange-700 group-hover:text-orange-800">
                          Upload Receipt
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          PDF, PNG, JPG up to 1MB
                        </p>
                      </div>
                    </label>
                  </div>
                  {receiptFile && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm text-green-700">Selected: {receiptFile.name}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? "Creating Listing..." : "List My Business"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}