import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Database, Code, Cpu, Globe, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ArchitecturePage: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CureCast Architecture</h1>
        <p className="text-gray-600 text-center mb-8">
          Technical overview of how CureCast is built and operates
        </p>
        
        <div className="grid gap-6 mb-8">
          {/* Frontend Section */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <Code className="h-6 w-6 text-blue-600" />
                <CardTitle>Frontend</CardTitle>
              </div>
              <CardDescription>User interface and client-side technologies</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">R</span>
                  </div>
                  <div>
                    <span className="font-medium">React</span>
                    <p className="text-gray-600 text-sm">JavaScript library for building user interfaces</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">N</span>
                  </div>
                  <div>
                    <span className="font-medium">Next.js</span>
                    <p className="text-gray-600 text-sm">React framework for production applications</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">T</span>
                  </div>
                  <div>
                    <span className="font-medium">Tailwind CSS</span>
                    <p className="text-gray-600 text-sm">Utility-first CSS framework for rapid UI development</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">TS</span>
                  </div>
                  <div>
                    <span className="font-medium">TypeScript</span>
                    <p className="text-gray-600 text-sm">Typed JavaScript for better code quality</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Backend Section */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center gap-2">
                <Server className="h-6 w-6 text-orange-600" />
                <CardTitle>Backend</CardTitle>
              </div>
              <CardDescription>Server-side technologies and services</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">F</span>
                  </div>
                  <div>
                    <span className="font-medium">Firebase</span>
                    <p className="text-gray-600 text-sm">Google's platform for app development, providing authentication, database, and hosting services</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">FS</span>
                  </div>
                  <div>
                    <span className="font-medium">Firestore</span>
                    <p className="text-gray-600 text-sm">NoSQL document database for storing and syncing app data</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">FF</span>
                  </div>
                  <div>
                    <span className="font-medium">Firebase Functions</span>
                    <p className="text-gray-600 text-sm">Serverless functions for backend logic and API endpoints</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* AI Section */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-2">
                <Cpu className="h-6 w-6 text-green-600" />
                <CardTitle>AI Integration</CardTitle>
              </div>
              <CardDescription>Artificial Intelligence capabilities</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">G</span>
                  </div>
                  <div>
                    <span className="font-medium">Gemini API</span>
                    <p className="text-gray-600 text-sm">Google's multimodal AI model used for inference (not training)</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">NLP</span>
                  </div>
                  <div>
                    <span className="font-medium">Natural Language Processing</span>
                    <p className="text-gray-600 text-sm">For understanding user symptoms and providing relevant health information</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">CV</span>
                  </div>
                  <div>
                    <span className="font-medium">Computer Vision</span>
                    <p className="text-gray-600 text-sm">For analyzing medical images and skin conditions</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Data Sources Section */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center gap-2">
                <Database className="h-6 w-6 text-purple-600" />
                <CardTitle>AI Data Sources</CardTitle>
              </div>
              <CardDescription>Sources of medical information</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">WHO</span>
                  </div>
                  <div>
                    <span className="font-medium">World Health Organization</span>
                    <p className="text-gray-600 text-sm">Global health guidelines and information</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">ICMR</span>
                  </div>
                  <div>
                    <span className="font-medium">Indian Council of Medical Research</span>
                    <p className="text-gray-600 text-sm">India-specific medical research and guidelines</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">DN</span>
                  </div>
                  <div>
                    <span className="font-medium">DermNet</span>
                    <p className="text-gray-600 text-sm">Dermatology information and image library</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium">MP</span>
                  </div>
                  <div>
                    <span className="font-medium">MedlinePlus</span>
                    <p className="text-gray-600 text-sm">Reliable health information from the U.S. National Library of Medicine</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Important Note Section */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <BookOpen className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-amber-800 mb-1">Important Note</h3>
                  <p className="text-amber-700">
                    CureCast uses the Gemini API for inference only, not training. This means our AI system makes predictions based on pre-trained models and does not learn from user interactions. Your data privacy is important to us.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ArchitecturePage; 