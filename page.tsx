'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

import { Shield, ScanLine, AlertTriangle, Cpu, Info, Link as LinkIcon, Lock, Trash2, BookLock, Upload } from 'lucide-react';

import { handleVulnerabilityScan, handleRemediation, handleBestPractices } from './actions';
import type { AiPoweredVulnerabilityDetectionOutput } from '@/ai/flows/ai-powered-vulnerability-detection';

const supportedLanguages = [
  "JavaScript", "Python", "Java", "C++", "C#", "TypeScript", "PHP", "Ruby", "Go", "Swift", "Kotlin", "Rust", "SQL", "HTML", "CSS"
];

const formSchema = z.object({
  language: z.string().min(1, { message: 'Please select a language.' }),
  code: z.string().min(20, { message: 'Please enter at least 20 characters of code.' }).max(8000, { message: 'Code cannot exceed 8000 characters.' }),
});

const bestPracticesFormSchema = z.object({
  language: z.string().min(1, { message: 'Please select a language.' }),
});

type Vulnerability = AiPoweredVulnerabilityDetectionOutput['vulnerabilities'][0];

function RemediationSection({ vulnerability, language, code, toast }: {
  vulnerability: Vulnerability;
  language: string;
  code: string;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const onGetRemediation = async () => {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await handleRemediation({
        codeSnippet: code,
        vulnerabilityDescription: vulnerability.description,
        language: language,
      });
      setSuggestion(result.remediationSuggestions);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Failed to get remediation",
        description: "An error occurred while generating suggestions. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <Button onClick={onGetRemediation} disabled={isLoading} size="sm">
        {isLoading ? (
          <>
            <Cpu className="mr-2 h-4 w-4 animate-spin" />
            Generating Fix...
          </>
        ) : (
          <>
            <Cpu className="mr-2 h-4 w-4" />
            Suggest a Fix
          </>
        )}
      </Button>
      {isLoading && <Skeleton className="mt-4 h-24 w-full rounded-md" />}
      {suggestion && (
        <div className="mt-4 animate-in fade-in-50 duration-500 rounded-md border bg-card/50 p-4">
          <h4 className="font-headline text-md mb-2 flex items-center">
            <Lock className="mr-2 h-4 w-4 text-primary" />
            AI Recommended Remediation
          </h4>
           <div className="font-code text-sm bg-muted/50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
            {suggestion}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <Card className="w-full mt-8 animate-pulse">
      <CardHeader>
        <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex h-12 items-center justify-between rounded-md border p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BestPracticesSection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [bestPractices, setBestPractices] = useState<string | null>(null);

  const form = useForm<z.infer<typeof bestPracticesFormSchema>>({
    resolver: zodResolver(bestPracticesFormSchema),
    defaultValues: {
      language: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof bestPracticesFormSchema>) => {
    setIsLoading(true);
    setBestPractices(null);
    try {
      const result = await handleBestPractices(values);
      setBestPractices(result.bestPractices);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to get best practices',
        description:
          'An error occurred while generating best practices. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="shadow-lg mt-12">
          <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <BookLock className="text-primary" />
                  Secure Coding Best Practices
              </CardTitle>
              <CardDescription>
                  Select a language to get AI-powered secure coding best practices.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FormField
                              control={form.control}
                              name="language"
                              render={({ field }) => (
                                  <FormItem className="md:col-span-1">
                                      <FormLabel className="font-headline">Language</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                              <SelectTrigger>
                                                  <SelectValue placeholder="Select language" />
                                              </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                              {supportedLanguages.map((lang) => (
                                                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                      </div>
                      <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                          {isLoading ? (
                              <>
                                  <Cpu className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                              </>
                          ) : (
                              <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Get Best Practices
                              </>
                          )}
                      </Button>
                  </form>
              </Form>
              {isLoading && <Skeleton className="mt-4 h-48 w-full rounded-md" />}
              {bestPractices && (
                  <div className="mt-4 animate-in fade-in-50 duration-500 rounded-md border bg-card/50 p-4">
                      <div
                          className="font-code text-sm bg-muted/50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words prose dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: bestPractices }}
                      />
                  </div>
              )}
          </CardContent>
      </Card>
  );
}

export default function CodeShieldPage() {
    const { toast } = useToast();
    const [scanResult, setScanResult] = useState<AiPoweredVulnerabilityDetectionOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            language: '',
            code: '',
        },
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          form.setValue('code', text);
        };
        reader.readAsText(file);
      }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        setScanResult(null);
        try {
            const result = await handleVulnerabilityScan(values);
            if (result.vulnerabilities.length === 0) {
                toast({
                    title: "Scan Complete: No Vulnerabilities Found",
                    description: "The AI scan completed and found no potential vulnerabilities.",
                    className: "bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600",
                });
            }
            setScanResult(result);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Scan Failed",
                description: "An error occurred while scanning the code. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getBadgeVariant = (severity: string): "destructive" | "secondary" | "outline" | "default" => {
        const lowerSeverity = severity.toLowerCase();
        if (lowerSeverity.includes('high') || lowerSeverity.includes('critical')) return 'destructive';
        if (lowerSeverity.includes('medium')) return 'secondary';
        if (lowerSeverity.includes('low')) return 'outline';
        return 'default';
    };
    
    return (
        <>
            <div className="container mx-auto px-4 py-8 md:py-12">
                <header className="text-center mb-12">
                    <div className="inline-flex items-center gap-4 mb-4">
                        <Shield className="h-12 w-12 text-primary" />
                        <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tighter">Code Shield</h1>
                    </div>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Paste your code, select the language, and let our AI assistant perform a swift and thorough security review.
                    </p>
                </header>

                <main className="max-w-4xl mx-auto">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                                <ScanLine className="text-primary" />
                                Create a New Scan
                            </CardTitle>
                            <CardDescription>Enter your code below to identify potential security vulnerabilities.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="language"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-1">
                                                    <FormLabel className="font-headline">Language</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select language" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {supportedLanguages.map(lang => (
                                                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-headline">Code Snippet</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Paste your code here..."
                                                        className="font-code h-64 resize-y"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex flex-col md:flex-row gap-2">
                                        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                                            {isLoading ? (
                                                <>
                                                    <Cpu className="mr-2 h-4 w-4 animate-spin" />
                                                    Scanning...
                                                </>
                                            ) : (
                                                <>
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    Scan for Vulnerabilities
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full md:w-auto"
                                            disabled={isLoading}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload File
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.h,.cs,.php,.rb,.go,.swift,.kt,.rs,.sql,.html,.css"
                                        />
                                        <Button 
                                            type="button" 
                                            variant="outline"
                                            onClick={() => form.setValue('code', '')} 
                                            className="w-full md:w-auto"
                                            disabled={isLoading || !form.watch('code')}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Clear Code
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {isLoading && <LoadingState />}
                    
                    {scanResult && scanResult.vulnerabilities.length > 0 && (
                        <div className="mt-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                                        <AlertTriangle className="text-destructive" />
                                        Scan Results
                                    </CardTitle>
                                    <CardDescription>
                                        Found {scanResult.vulnerabilities.length} potential vulnerabilit{scanResult.vulnerabilities.length > 1 ? 'ies' : 'y'}.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {scanResult.vulnerabilities.map((vuln, index) => (
                                            <AccordionItem value={`item-${index}`} key={index}>
                                                <AccordionTrigger>
                                                    <div className="flex items-center justify-between w-full pr-4">
                                                        <span className="text-left mr-4 whitespace-normal break-words">{vuln.description}</span>
                                                        <Badge variant={getBadgeVariant(vuln.severity)} className="flex-shrink-0">
                                                            {vuln.severity}
                                                        </Badge>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-4">
                                                    <div>
                                                        <h4 className="font-headline text-md mb-1">Location</h4>
                                                        <p className="font-code text-sm bg-muted/50 px-2 py-1 rounded-md inline-block">{vuln.location}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-headline text-md mb-1 flex items-center gap-2">
                                                            <Info className="h-4 w-4 text-accent" />
                                                            Recommendation
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">{vuln.recommendation}</p>
                                                    </div>
                                                    {vuln.references && vuln.references.length > 0 && (
                                                        <div>
                                                            <h4 className="font-headline text-md mb-1 flex items-center gap-2">
                                                                <LinkIcon className="h-4 w-4 text-accent" />
                                                                References
                                                            </h4>
                                                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                                {vuln.references.map((ref, i) => <li key={i}><a href={ref} target="_blank" rel="noopener noreferrer" className="text-accent-foreground hover:underline">{ref}</a></li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <RemediationSection 
                                                        vulnerability={vuln} 
                                                        language={form.getValues('language')} 
                                                        code={form.getValues('code')}
                                                        toast={toast} 
                                                    />
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                     <BestPracticesSection />
                </main>
            </div>
            <Toaster />
        </>
    );
}

    