/**
 * Stamp Upload Form Component
 * نموذج رفع الطوابع للتوثيق
 */

import { useState, useCallback } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Upload, Camera, DollarSign, Shield, CheckCircle } from 'lucide-react';

interface StampUploadFormProps {
  onSuccess?: (data: any) => void;
}

type Rarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';

export function StampUploadForm({ onSuccess }: StampUploadFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    country: '',
    year: new Date().getFullYear(),
    denomination: '',
    condition: 'fine',
    rarity: 'uncommon' as Rarity,
    estimatedValue: 0,
    images: [] as string[],
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [costEstimate, setCostEstimate] = useState<any>(null);

  // Calculate minting cost
  const { data: costData, refetch: recalculateCost } = trpc.stampAuthentication.calculateMintingCost.useQuery(
    {
      stampValue: formData.estimatedValue,
      rarity: formData.rarity,
    },
    {
      enabled: formData.estimatedValue > 0,
    }
  );

  // Upload mutation
  const uploadMutation = trpc.stampAuthentication.uploadStamp.useMutation({
    onSuccess: (data) => {
      alert('تم رفع الطابع بنجاح! رقم الشهادة: ' + data.authCertificate);
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      alert('خطأ: ' + error.message);
    },
  });

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
      alert('يرجى رفع صورة واحدة على الأقل');
      return;
    }

    if (!confirm(`تكلفة السك: ${costData?.totalStampCoins} StampCoins\nهل تريد المتابعة؟`)) {
      return;
    }

    // Convert images to base64 then trigger mutation
    const base64Images = await Promise.all(
      imageFiles.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    uploadMutation.mutate({
      ...formData,
      images: base64Images,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Upload className="w-6 h-6" />
            رفع طابع للتوثيق
          </CardTitle>
          <p className="text-gray-600 mt-2">
            قم برفع صورة طابعك وسنقوم بتوثيقه كـ NFT على البلوكشين
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cost Estimate */}
            {costData && (
              <Alert className="bg-emerald-50 border-emerald-200">
                <DollarSign className="w-4 h-4" />
                <AlertDescription>
                  <div className="font-semibold text-emerald-900 mb-2">
                    تكلفة السك المقدرة:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>التكلفة الأساسية: ${costData.baseCost.toFixed(2)}</div>
                    <div>معامل الندرة: {costData.rarityMultiplier}x</div>
                    <div>أتعاب المنصة: ${costData.platformFee.toFixed(2)}</div>
                    <div>رسوم الغاز: ${costData.gasFee.toFixed(2)}</div>
                    <div className="col-span-2 font-bold text-lg text-emerald-700 mt-2">
                      المجموع: {costData.totalStampCoins} StampCoins (${costData.totalUSD.toFixed(2)})
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">عنوان الطابع *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: الطابع الأسود البريطاني 1840"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف تفصيلي عن الطابع..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الدولة *</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="مثال: Great Britain"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">السنة *</label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: parseInt(e.target.value) })
                    }
                    min={1840}
                    max={2030}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value as any })
                    }
                  >
                    <option value="mint">ممتازة (Mint)</option>
                    <option value="very_fine">جيدة جداً</option>
                    <option value="fine">جيدة</option>
                    <option value="used">مستعملة</option>
                    <option value="poor">رديئة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">الندرة *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.rarity}
                    onChange={(e) => {
                      setFormData({ ...formData, rarity: e.target.value as any });
                      setTimeout(recalculateCost, 100);
                    }}
                  >
                    <option value="common">عادي</option>
                    <option value="uncommon">غير شائع</option>
                    <option value="rare">نادر</option>
                    <option value="very_rare">نادر جداً</option>
                    <option value="legendary">أسطوري</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">القيمة المقدرة (USD) *</label>
                  <Input
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => {
                      setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) });
                      setTimeout(recalculateCost, 100);
                    }}
                    min={0}
                    step={0.01}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">الفئة</label>
                <Input
                  value={formData.denomination}
                  onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                  placeholder="مثال: 1 Penny"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">صور الطابع *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">اسحب الصور هنا أو انقر للاختيار</p>
                <p className="text-sm text-gray-500 mb-4">
                  يدعم: JPG, PNG, WEBP (حتى 10 صور)
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="max-w-xs mx-auto"
                />
              </div>

              {imageFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {imageFiles.map((file, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Notice */}
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">ضمان التوثيق</div>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>سيتم مراجعة طابعك من قبل خبراء</li>
                  <li>توثيق على البلوكشين لا يمكن تزويره</li>
                  <li>تخزين آمن على IPFS</li>
                  <li>شهادة توثيق رقمية فريدة</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={uploadMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {uploadMutation.isPending ? (
                  'جاري الرفع...'
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    رفع وتوثيق الطابع
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
