
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { myths } from '@/services/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import MythCard from './MythCard';
import { Button } from '@/components/ui/button';

// Function to get translated content based on current language
const getTranslatedContent = (
  myth: any, 
  property: 'title' | 'myth' | 'reality', 
  language: 'english' | 'hindi' | 'telugu'
) => {
  if (language === 'english' || !myth.translations) {
    return myth[property];
  }
  
  if (myth.translations[language] && myth.translations[language][property]) {
    return myth.translations[language][property];
  }
  
  // Fallback to English
  return myth[property];
};

const MythsView = () => {
  const { currentLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Group myths by category for tabs
  const categories = [...new Set(myths.map(myth => myth.category))];
  
  // Filter myths based on search query and active tab
  const filteredMyths = myths.filter(myth => {
    const matchesSearch = 
      getTranslatedContent(myth, 'title', currentLanguage).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getTranslatedContent(myth, 'myth', currentLanguage).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeTab === 'all' || myth.category === activeTab;
    
    return matchesSearch && matchesCategory;
  });
  
  // Prepare the tabs for categories
  const mythTabs = [
    { id: 'all', label: 'All' },
    ...categories.map(category => ({
      id: category,
      label: category.charAt(0).toUpperCase() + category.slice(1) // Capitalize
    }))
  ];
  
  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Health Facts & Myths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Learn about common health myths and the scientific facts behind them.
          </p>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search myths..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <div className="overflow-x-auto hide-scrollbar">
              <TabsList className="w-full justify-start">
                {mythTabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <TabsContent value={activeTab} className="pt-4 space-y-4">
              {filteredMyths.length > 0 ? (
                filteredMyths.map(myth => (
                  <MythCard
                    key={myth.id}
                    myth={myth}
                    translateFn={(property) => getTranslatedContent(myth, property, currentLanguage)}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No myths found matching your search.</p>
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('');
                    setActiveTab('all');
                  }}>
                    Clear filters
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MythsView;
