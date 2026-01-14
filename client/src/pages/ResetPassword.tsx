import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, CheckCircle, XCircle, Lock } from "lucide-react";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(4, "كلمة المرور يجب أن تكون 4 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    setToken(tokenParam);

    if (!tokenParam) {
      setValidating(false);
      setTokenError("رابط غير صالح");
      return;
    }

    validateToken(tokenParam);
  }, []);

  const validateToken = async (tokenValue: string) => {
    try {
      const res = await fetch(`/api/auth/reset-password/validate?token=${tokenValue}`);
      const result = await res.json();
      
      if (result.valid) {
        setTokenValid(true);
      } else {
        setTokenError(result.message || "رمز غير صالح أو منتهي الصلاحية");
      }
    } catch (error) {
      setTokenError("حدث خطأ أثناء التحقق من الرمز");
    } finally {
      setValidating(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!token) return;

    setResetting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      });
      
      const result = await res.json();

      if (res.ok && result.success) {
        setResetSuccess(true);
        toast({
          title: "تم بنجاح",
          description: "تم تغيير كلمة المرور بنجاح",
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: result.message || "حدث خطأ أثناء إعادة تعيين كلمة المرور",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة تعيين كلمة المرور",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md bg-neutral-900 border-white/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <CardTitle className="text-2xl text-white">إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription className="text-slate-400">
            Phantom RP Police
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validating ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <p className="text-slate-400">جاري التحقق من الرابط...</p>
            </div>
          ) : tokenError ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="w-16 h-16 text-red-400" />
              <p className="text-red-400 text-center">{tokenError}</p>
              <Button 
                onClick={() => setLocation("/")} 
                className="mt-4"
                data-testid="button-go-home"
              >
                العودة للصفحة الرئيسية
              </Button>
            </div>
          ) : resetSuccess ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-16 h-16 text-green-400" />
              <p className="text-green-400 text-center text-lg">تم تغيير كلمة المرور بنجاح!</p>
              <p className="text-slate-400 text-center">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</p>
              <Button 
                onClick={() => setLocation("/")} 
                className="mt-4 bg-blue-600 hover:bg-blue-500"
                data-testid="button-go-login"
              >
                الذهاب لتسجيل الدخول
              </Button>
            </div>
          ) : tokenValid ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-white">كلمة المرور الجديدة</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="password" 
                            placeholder="أدخل كلمة المرور الجديدة" 
                            className="bg-white/5 border-white/10 text-right pr-10" 
                            data-testid="input-new-password"
                            {...field} 
                          />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-white">تأكيد كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="password" 
                            placeholder="أعد إدخال كلمة المرور" 
                            className="bg-white/5 border-white/10 text-right pr-10" 
                            data-testid="input-confirm-password"
                            {...field} 
                          />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 mt-6" 
                  disabled={resetting}
                  data-testid="button-reset-password"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري إعادة التعيين...
                    </>
                  ) : (
                    "إعادة تعيين كلمة المرور"
                  )}
                </Button>
              </form>
            </Form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
