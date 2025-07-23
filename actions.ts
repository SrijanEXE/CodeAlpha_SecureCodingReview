'use server';

import { aiPoweredVulnerabilityDetection, AiPoweredVulnerabilityDetectionInput } from '@/ai/flows/ai-powered-vulnerability-detection';
import { getRemediationSuggestions, RemediationSuggestionsInput } from '@/ai/flows/remediation-suggestions';
import { getSecureCodingBestPractices, SecureCodingBestPracticesInput } from '@/ai/flows/secure-coding-best-practices';
import { z } from 'zod';

const scanSchema = z.object({
  code: z.string().min(1).max(8000),
  language: z.string().min(1),
});

const remediationSchema = z.object({
  codeSnippet: z.string().min(1).max(8000),
  vulnerabilityDescription: z.string().min(1),
  language: z.string().min(1),
});

const bestPracticesSchema = z.object({
  language: z.string().min(1),
});

export async function handleVulnerabilityScan(input: AiPoweredVulnerabilityDetectionInput) {
    const validatedInput = scanSchema.parse(input);
    const result = await aiPoweredVulnerabilityDetection(validatedInput);
    return result;
}

export async function handleRemediation(input: RemediationSuggestionsInput) {
    const validatedInput = remediationSchema.parse(input);
    const result = await getRemediationSuggestions(validatedInput);
    return result;
}

export async function handleBestPractices(input: SecureCodingBestPracticesInput) {
    const validatedInput = bestPracticesSchema.parse(input);
    const result = await getSecureCodingBestPractices(validatedInput);
    return result;
}
