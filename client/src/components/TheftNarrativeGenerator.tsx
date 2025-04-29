import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, ClipboardCopy, ClipboardCheck, FileText, SpellCheck, CheckCheck, Edit, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useGrammarCheck } from "@/hooks/use-grammar-check";
import { applyGrammarSuggestion, applyAllGrammarSuggestions, GrammarIssue } from "@/lib/grammar-utils";

const theftTemplates = {
  "Cancellation - Traditional, all items were scanned":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks}, scanned {Number of Snacks/Drinks} in the kiosk, canceled the transaction, and left the market area with {Number of Items Left With} unpaid items.",
  "Cancellation - Traditional, only some items were scanned":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks}, scanned {Number of Snacks/Drinks} in the kiosk while overlooking {Number of Items Overlooked/Unpaid}, canceled the transaction, and left the market area with {Number of Items Left With} unpaid items.",
  "Cancellation - Failed Payment":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and scanned {Number of Snacks/Drinks} in the kiosk. The individual attempted to pay {Number of Times Tried to Pay} times using {Payment Method Used} for {Item Name from the Report}, but was unsuccessful. Then, the individual left the market area with {Number of Items Left With} unpaid items.",
  "Cancellation - Timeout":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and scanned {Number of Snacks/Drinks} in the kiosk. The individual attempted to pay {Number of Times Tried to Pay} times using {Payment Method Used}, but progress was ceased for the transaction. While the pending transaction timed out due to inactivity, the individual left the market area with {Number of Items Left With} unpaid items.",
  "Cancellation - Proxy Cancel":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and scanned {Number of Snacks/Drinks} in the kiosk. The individual attempted to pay, but progress was ceased for the transaction. Nevertheless, the individual left the market area with {Number of Items Left With} unpaid items while another individual canceled the transaction.",
  "Cancellation/Underinging":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks}, scanned {Number of Snacks/Drinks} in the kiosk, and canceled the transaction. Then, the individual re-scanned the same items, but despite completing the transaction, the individual only paid for {Number of Items Paid} out of {Number of Snacks/Drinks} actual items. Nevertheless, the individual left the market area with {Number of Items Paid} paid items and {Number of Items Overlooked/Unpaid} unpaid items.",
  "Underinging - Traditional":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and scanned {Number of Snacks/Drinks} in the kiosk, but despite completing the transaction, the individual only paid for {Number of Items Paid} out of {Number of Snacks/Drinks} items. Nevertheless, the individual left the market area with {Number of Items Paid} paid items and {Number of Items Overlooked/Unpaid} unpaid items.",
  "Underinging - Free Item":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and scanned {Number of Snacks/Drinks} in the kiosk, but after completing the transaction, selected {Number of Items Overlooked/Unpaid} additional item(s) without scanning. Hence, the individual left the market area with {Number of Items Paid} paid items and {Number of Items Overlooked/Unpaid} unpaid items.",
  "Underinging - Switcheroo":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and interacted with the kiosk, but despite completing the transaction, the individual inputted a totally irrelevant item, identified as a {Name of the Irrelevant Item}, costing {Cost of Irrelevant Item Inputted}, and the cost of the {Name of the Irrelevant Item} was lower than the cost of the item the individual selected, identified as a {Item Name from the Report}. Hence, the individual only paid for {Number of Items Paid} out of {Number of Snacks/Drinks} actual items. Nevertheless, the individual left the market area with {Number of Items Paid} paid items and {Number of Items Overlooked/Unpaid} unpaid items.",
  "Underinging - No Reports Available":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and scanned {Number of Snacks/Drinks} in the kiosk, but the kiosk's screen showed only {Number of Items Paid} registered. Hence, the individual only paid for {Number of Items Paid} out of {Number of Snacks/Drinks} total items. Nevertheless, the individual left the market area with {Number of Items Paid} paid items and {Number of Items Overlooked/Unpaid} unpaid items.",
  "Walkout - Traditional":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and left the market area without paying for {Number of Snacks/Drinks}.",
  "Walkout - Pseudo-Cancellation":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and scanned {Number of Snacks/Drinks} in the kiosk. The individual attempted to pay {Number of Times Tried to Pay} times using {Payment Method Used}, but progress ceased. While the pending transaction returned to the home screen, the individual left with {Number of Items Left With} unpaid items.",
  "Walkout - Fake Scan":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and attempted to scan {Number of Snacks/Drinks}, but nothing happened. The individual then left without paying.",
  "Walkout - Playing with the Kiosk":
    "The individual wearing {Type of Clothing} selected {Number of Snacks/Drinks} and interacted with the kiosk, but did not scan the items. The individual then left without paying.",
  "Null Transactions":
    "The individual wearing {Type of Clothing} entered the market and interacted with the kiosk, but as per the reports, did not scan anything. The individual selected {Number of Snacks/Drinks} and left with {Number of Items Left With} unpaid items after the transaction timed out.",
  "Individual lingers in the market area":
    "The individual wearing {Type of Clothing} entered at {Time Item Consumed Without Paying}, stayed nearby, [insert theft narrative here], returned to the table, stayed until leaving with {Number of Items Overlooked/Unpaid} unpaid items at {Individual Left Time}.",
  "Individual lingers and consumes unpaid items":
    "The individual wearing {Type of Clothing} entered at {Time Item Consumed Without Paying}, stayed nearby, [insert theft narrative here], consumed unpaid items, and left with {Number of Items Overlooked/Unpaid} unpaid items at {Individual Left Time}.",
  "Individual goes off-cam and returns":
    "...the individual went off-camera for a while. Then, the individual returned to the market area...",
  "Kiosk not visible":
    "...However, as per the market reports, the transaction was cancelled, and payments involving the items of concern taking place during the indicated timeframe and the succeeding one-hour timeframe were non-existent. Nevertheless, the individual left the market area with {Number of Items Overlooked/Unpaid} items.",
  "Individual re-scans items":
    "[insert theft narrative here]...Then, the individual re-scanned {Number of Items Paid} items...",
  "Individual enters market area with others":
    "The individual wearing {Type of Clothing} entered the market area accompanied by another individual. They [insert theft narrative here]"
};

const fieldMappings = {
  typeOfClothing: "Type of Clothing",
  numberOfSnacksDrinks: "Number of Snacks/Drinks",
  numberOfItemsLeft: "Number of Items Left With",
  numberOfItemsPaid: "Number of Items Paid",
  numberOfTimesTriedToPay: "Number of Times Tried to Pay",
  paymentMethod: "Payment Method Used",
  numberOfItemsOverlooked: "Number of Items Overlooked/Unpaid",
  numberOfItemsOverlookedorUnpaidadditionalitems: "Number of Items Overlooked/Unpaid additional items",
  nameOfIdentifiedSelectedItemBeingOverLooked: "Name of Identified Selected Item Being OverLooked",
  costOfOverlookedItem: "Cost of Overlooked Item",
  itemNameFromReport: "Item Name from the Report",
  costOfIrrelevantItem: "Cost of Irrelevant Item Inputted",
  nameOfIrrelevantItem: "Name of the Irrelevant Item",
  timeItemConsumed: "Time Item Consumed Without Paying",
  individualLeftTime: "Individual Left Time",
};

export default function TheftNarrativeGenerator() {
  // Form state
  const [formData, setFormData] = useState({
    theftType: "",
    typeOfClothing: "",
    numberOfSnacksDrinks: "",
    numberOfItemsLeft: "",
    numberOfItemsPaid: "",
    numberOfTimesTriedToPay: "",
    paymentMethod: "",
    numberOfItemsOverlooked: "",
    numberOfItemsOverlookedorUnpaidadditionalitems: "",
    nameOfIdentifiedSelectedItemBeingOverLooked: "",
    costOfOverlookedItem: "",
    itemNameFromReport: "",
    costOfIrrelevantItem: "",
    nameOfIrrelevantItem: "",
    timeItemConsumed: "",
    individualLeftTime: "",
  });

  // UI state
  const [narrative, setNarrative] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showGrammarIssues, setShowGrammarIssues] = useState(false);
  const [copied, setCopied] = useState(false);

  // References
  const narrativeTextRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { toast } = useToast();
  const { 
    checkGrammar, 
    grammarIssues, 
    isCheckingGrammar, 
    error: grammarError, 
    grammarScore 
  } = useGrammarCheck();

  // Format field names for display
  const formatFieldName = (fieldName: string) => {
    return fieldMappings[fieldName as keyof typeof fieldMappings] || fieldName;
  };

  // Handle form field changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generate narrative from template
  const generateNarrative = async () => {
    if (!formData.theftType) {
      toast({
        title: "Theft type required",
        description: "Please select a theft type to generate a narrative.",
        variant: "destructive"
      });
      return;
    }

    let template = theftTemplates[formData.theftType as keyof typeof theftTemplates];
    if (!template) return;

    Object.entries(formData).forEach(([key, value]) => {
      const placeholder = `{${fieldMappings[key as keyof typeof fieldMappings]}}`;
      if (placeholder) {
        template = template.replaceAll(placeholder, value || "[Not Provided]");
      }
    });

    setNarrative(template);
    
    // Reset grammar checking state when generating a new narrative
    setShowGrammarIssues(false);
    
    // Automatically run grammar check after generating narrative
    try {
      await checkGrammar(template);
      // Show grammar issues if any were found
      if (grammarIssues && grammarIssues.length > 0) {
        setShowGrammarIssues(true);
      }
    } catch (error) {
      // Error handling is already done in the checkGrammar function
      console.error("Failed to run automatic grammar check:", error);
    }
  };

  // Handle grammar check
  const handleGrammarCheck = async () => {
    if (!narrative) return;
    await checkGrammar(narrative);
  };

  // Apply a specific grammar suggestion
  const handleApplySuggestion = (issueIndex: number) => {
    if (grammarIssues && grammarIssues.length > 0) {
      const newNarrative = applyGrammarSuggestion(narrative, grammarIssues[issueIndex]);
      setNarrative(newNarrative);
    }
  };

  // Apply all grammar suggestions
  const handleApplyAllSuggestions = () => {
    if (grammarIssues && grammarIssues.length > 0) {
      const newNarrative = applyAllGrammarSuggestions(narrative, grammarIssues);
      setNarrative(newNarrative);
      // Reset issues after applying all
      setShowGrammarIssues(false);
    }
  };

  // Copy narrative to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  // Reset the error from grammar API
  const dismissGrammarError = () => {
    // This will be handled in the hook
  };

  // Get the appropriate grammar score badge
  const getGrammarScoreBadge = () => {
    if (!grammarScore) return null;
    
    let variant: "excellent" | "good" | "needsWork";
    let emoji: string;
    let text: string;
    
    if (grammarScore >= 90) {
      variant = "excellent";
      emoji = "😀";
      text = "Excellent";
    } else if (grammarScore >= 70) {
      variant = "good";
      emoji = "🙂";
      text = "Good";
    } else {
      variant = "needsWork";
      emoji = "😐";
      text = "Needs Work";
    }
    
    return (
      <Badge variant={variant} size="lg" className="flex items-center gap-1">
        <span className="text-lg">{emoji}</span> {text}
      </Badge>
    );
  };

  // Render highlighted text with grammar issues
  const renderHighlightedText = () => {
    if (!narrative || !grammarIssues || grammarIssues.length === 0) {
      return <div className="whitespace-pre-wrap">{narrative}</div>;
    }

    // Create segments with highlighted issues
    let lastIndex = 0;
    const segments = [];
    
    // Sort issues by their position in the text
    const sortedIssues = [...grammarIssues].sort((a, b) => {
      const posA = narrative.indexOf(a.original);
      const posB = narrative.indexOf(b.original);
      return posA - posB;
    });
    
    for (const issue of sortedIssues) {
      const issueIndex = narrative.indexOf(issue.original, lastIndex);
      if (issueIndex === -1) continue;
      
      // Add text before the issue
      if (issueIndex > lastIndex) {
        segments.push(
          <span key={`text-${lastIndex}`}>
            {narrative.substring(lastIndex, issueIndex)}
          </span>
        );
      }
      
      // Add the highlighted issue
      segments.push(
        <span 
          key={`issue-${issueIndex}`}
          className="bg-red-100 border-b-2 border-dotted border-red-400 cursor-pointer"
          title={issue.suggestion}
        >
          {issue.original}
        </span>
      );
      
      lastIndex = issueIndex + issue.original.length;
    }
    
    // Add any remaining text
    if (lastIndex < narrative.length) {
      segments.push(
        <span key={`text-end`}>
          {narrative.substring(lastIndex)}
        </span>
      );
    }
    
    return <div className="whitespace-pre-wrap">{segments}</div>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Theft Narrative Generator</h1>
        <p className="text-gray-500">Generate precise theft descriptions with AI grammar checking</p>
      </header>

      <motion.div className="grid gap-6">
        {/* Theft Type Form */}
        <Card>
          <CardContent className="pt-6">
            {/* Theft Type Selection */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Theft Type</label>
              <Select onValueChange={(val) => handleChange("theftType", val)} value={formData.theftType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Theft Type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(theftTemplates).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Main Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formatFieldName("typeOfClothing")}
                </label>
                <Input
                  placeholder="e.g., a blue shirt"
                  value={formData.typeOfClothing}
                  onChange={(e) => handleChange("typeOfClothing", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formatFieldName("numberOfSnacksDrinks")}
                </label>
                <Input
                  placeholder="e.g., 3"
                  value={formData.numberOfSnacksDrinks}
                  onChange={(e) => handleChange("numberOfSnacksDrinks", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formatFieldName("numberOfItemsLeft")}
                </label>
                <Input
                  placeholder="e.g., 2"
                  value={formData.numberOfItemsLeft}
                  onChange={(e) => handleChange("numberOfItemsLeft", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formatFieldName("numberOfItemsPaid")}
                </label>
                <Input
                  placeholder="e.g., 1"
                  value={formData.numberOfItemsPaid}
                  onChange={(e) => handleChange("numberOfItemsPaid", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formatFieldName("numberOfItemsOverlooked")}
                </label>
                <Input
                  placeholder="e.g., 2"
                  value={formData.numberOfItemsOverlooked}
                  onChange={(e) => handleChange("numberOfItemsOverlooked", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formatFieldName("numberOfTimesTriedToPay")}
                </label>
                <Input
                  placeholder="e.g., 3"
                  value={formData.numberOfTimesTriedToPay}
                  onChange={(e) => handleChange("numberOfTimesTriedToPay", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formatFieldName("paymentMethod")}
                </label>
                <Input
                  placeholder="e.g., credit card, Apple Pay"
                  value={formData.paymentMethod}
                  onChange={(e) => handleChange("paymentMethod", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formatFieldName("itemNameFromReport")}
                </label>
                <Input
                  placeholder="e.g., Coca-Cola"
                  value={formData.itemNameFromReport}
                  onChange={(e) => handleChange("itemNameFromReport", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex justify-between">
                  <Button onClick={generateNarrative} className="mr-2">
                    <FileText className="h-4 w-4 mr-2" /> Generate Narrative
                  </Button>
                  <Button 
                    onClick={handleGrammarCheck} 
                    variant="outline" 
                    disabled={!narrative || isCheckingGrammar}
                  >
                    {isCheckingGrammar ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking Grammar</>
                    ) : (
                      <><SpellCheck className="h-4 w-4 mr-2" /> Check Grammar</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Toggle for Optional Fields */}
            <button 
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-sm text-primary flex items-center"
            >
              {showOptionalFields ? (
                <><span className="mr-1">-</span> Hide additional fields</>
              ) : (
                <><span className="mr-1">+</span> Show more fields</>
              )}
            </button>
            
            {/* Optional Fields */}
            <AnimatePresence>
              {showOptionalFields && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Items Unpaid
                      </label>
                      <Input
                        placeholder="e.g., 1"
                        value={formData.numberOfItemsOverlookedorUnpaidadditionalitems}
                        onChange={(e) => handleChange("numberOfItemsOverlookedorUnpaidadditionalitems", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name of Overlooked Item
                      </label>
                      <Input
                        placeholder="e.g., Snickers"
                        value={formData.nameOfIdentifiedSelectedItemBeingOverLooked}
                        onChange={(e) => handleChange("nameOfIdentifiedSelectedItemBeingOverLooked", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost of Overlooked Item
                      </label>
                      <Input
                        placeholder="e.g., $1.99"
                        value={formData.costOfOverlookedItem}
                        onChange={(e) => handleChange("costOfOverlookedItem", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name of Irrelevant Item
                      </label>
                      <Input
                        placeholder="e.g., Gum"
                        value={formData.nameOfIrrelevantItem}
                        onChange={(e) => handleChange("nameOfIrrelevantItem", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost of Irrelevant Item
                      </label>
                      <Input
                        placeholder="e.g., $0.99"
                        value={formData.costOfIrrelevantItem}
                        onChange={(e) => handleChange("costOfIrrelevantItem", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Item Consumed
                      </label>
                      <Input
                        placeholder="e.g., 3:45 PM"
                        value={formData.timeItemConsumed}
                        onChange={(e) => handleChange("timeItemConsumed", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Individual Left Time
                      </label>
                      <Input
                        placeholder="e.g., 4:15 PM"
                        value={formData.individualLeftTime}
                        onChange={(e) => handleChange("individualLeftTime", e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Narrative Output */}
        <AnimatePresence>
          {narrative && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Generated Narrative</h2>
                    
                    <div className="flex items-center space-x-2">
                      {grammarScore !== null && getGrammarScoreBadge()}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={copyToClipboard}
                        className="text-gray-600 hover:text-primary"
                      >
                        {copied ? (
                          <><ClipboardCheck className="h-4 w-4 mr-1" /> Copied</>
                        ) : (
                          <><ClipboardCopy className="h-4 w-4 mr-1" /> Copy</>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Grammar checking toggle */}
                  {grammarIssues && grammarIssues.length > 0 && (
                    <div className="mb-3 flex justify-end">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="grammar-toggle"
                          checked={showGrammarIssues}
                          onCheckedChange={setShowGrammarIssues}
                        />
                        <Label htmlFor="grammar-toggle">Show Grammar Issues</Label>
                      </div>
                    </div>
                  )}
                  
                  {/* Narrative text container */}
                  <div className="relative">
                    <div 
                      className="border rounded-md p-4 min-h-[200px] bg-gray-50 relative"
                      ref={narrativeTextRef}
                    >
                      {showGrammarIssues && grammarIssues && grammarIssues.length > 0 
                        ? renderHighlightedText()
                        : <div className="whitespace-pre-wrap">{narrative}</div>
                      }
                    </div>
                  </div>
                  
                  {/* Grammar suggestions panel */}
                  <AnimatePresence>
                    {showGrammarIssues && grammarIssues && grammarIssues.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 border rounded-md p-4 bg-blue-50 overflow-hidden"
                      >
                        <h3 className="font-medium text-gray-900 mb-2">Grammar Suggestions</h3>
                        <div className="space-y-3">
                          {grammarIssues.map((issue, index) => (
                            <div key={index} className="p-3 bg-white rounded-md shadow-sm border border-gray-200">
                              <div className="flex justify-between">
                                <div className="text-red-600 line-through">{issue.original}</div>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 h-6"
                                  onClick={() => handleApplySuggestion(index)}
                                >
                                  Apply
                                </Button>
                              </div>
                              <div className="text-green-600 font-medium">{issue.suggestion}</div>
                              {issue.explanation && (
                                <div className="text-xs text-gray-500 mt-1">{issue.explanation}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Error message */}
                  <AnimatePresence>
                    {grammarError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 bg-red-50 shadow-sm rounded-lg border border-red-200 p-4"
                      >
                        <div className="flex">
                          <AlertTriangle className="text-red-500 h-5 w-5 mr-3" />
                          <div>
                            <h3 className="text-red-800 font-medium">Error checking grammar</h3>
                            <p className="text-red-700 text-sm">{grammarError}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit Narrative
                    </Button>
                    
                    {showGrammarIssues && grammarIssues && grammarIssues.length > 0 && (
                      <Button 
                        variant="outline" 
                        onClick={handleApplyAllSuggestions}
                        className="flex items-center"
                      >
                        <CheckCheck className="h-4 w-4 mr-2" /> Apply All Suggestions
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
