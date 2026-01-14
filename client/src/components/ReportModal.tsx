import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { useCreateReport } from "@/hooks/use-police-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Paperclip, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportModal({ open, onOpenChange }: ReportModalProps) {
  const { toast } = useToast();
  const createReport = useCreateReport();
  const [attachments, setAttachments] = useState<string[]>([]);
  const filePathMapRef = useRef<Map<string, string>>(new Map());
  
  const form = useForm({
    resolver: zodResolver(insertReportSchema.omit({ attachments: true })),
    defaultValues: {
      name: "",
      discord: "",
      content: "",
    },
  });

  const onSubmit = async (data: any) => {
    if (attachments.length === 0) {
      toast({
        variant: "destructive",
        title: "يجب رفع ملف واحد على الأقل",
      });
      return;
    }
    try {
      await createReport.mutateAsync({
        ...data,
        attachments: attachments,
      });
      toast({
        title: "تم إرسال البلاغ بنجاح",
        description: "شكراً لتعاونكم مع رجال الأمن.",
      });
      form.reset();
      setAttachments([]);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في إرسال البلاغ",
        description: error.message,
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-right">تقديم بلاغ جديد</DialogTitle>
          <DialogDescription className="text-right text-slate-400">
            يرجى ملء البيانات التالية لتقديم بلاغ رسمي.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>الاسم الكامل</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسمك" className="bg-white/5 border-white/10 text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discord"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>معرف الديسكورد (Discord ID) *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: 123456789012345678" className="bg-white/5 border-white/10 text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>تفاصيل البلاغ</FormLabel>
                  <FormControl>
                    <Textarea placeholder="اشرح ماذا حدث..." className="bg-white/5 border-white/10 text-right min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel className="text-right block">المرفقات (صور/ملفات) *</FormLabel>
              {attachments.length === 0 && form.formState.isSubmitted && (
                <p className="text-sm text-red-500 text-right">يجب رفع ملف واحد على الأقل</p>
              )}
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((url, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-white/5 border-white/10 py-1 pr-1 pl-2">
                    <button 
                      type="button" 
                      onClick={() => removeAttachment(index)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] truncate max-w-[100px]">{url.split('/').pop()}</span>
                  </Badge>
                ))}
              </div>
              
              <ObjectUploader
                maxNumberOfFiles={5}
                onGetUploadParameters={async (file) => {
                  const res = await fetch("/api/uploads/request-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: file.name,
                      size: file.size,
                      contentType: file.type || "application/octet-stream",
                    }),
                  });
                  const data = await res.json();
                  filePathMapRef.current.set(file.id, data.objectPath);
                  return {
                    method: "PUT" as const,
                    url: data.uploadURL,
                    headers: { "Content-Type": file.type || "application/octet-stream" },
                  };
                }}
                onComplete={(result) => {
                  if (result.successful && result.successful.length > 0) {
                    const newUrls = result.successful.map((file: any) => {
                      return filePathMapRef.current.get(file.id) || file.name;
                    });
                    setAttachments(prev => [...prev, ...newUrls]);
                    toast({
                      title: "تم رفع الملفات",
                      description: `تم رفع ${result.successful.length} ملف بنجاح.`,
                    });
                  }
                }}
                buttonClassName="w-full bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 h-10 gap-2 border border-dashed"
              >
                <Paperclip className="w-4 h-4" />
                إضافة مرفقات
              </ObjectUploader>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-11" disabled={createReport.isPending}>
              {createReport.isPending ? "جاري الإرسال..." : "إرسال البلاغ"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
