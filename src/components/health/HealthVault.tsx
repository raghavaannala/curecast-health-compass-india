import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, File, Plus } from 'lucide-react';

interface HealthRecord {
  id: string;
  type: string;
  date: string;
  title: string;
  file?: File;
}

const HealthVault: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newRecord: HealthRecord = {
        id: Date.now().toString(),
        type: file.type,
        date: new Date().toISOString(),
        title: file.name,
        file: file
      };
      setRecords([...records, newRecord]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">Health Vault</h2>
          <p className="text-muted-foreground">Securely store and manage your health records</p>
        </div>
        <Button onClick={() => document.getElementById('file-upload')?.click()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileUpload}
        />
      </div>

      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <Card key={record.id} className="p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold truncate">{record.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(record.date).toLocaleDateString()}
                  </p>
                </div>
                <File className="w-5 h-5 text-primary" />
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Share
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Records Yet</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            Upload your medical records, prescriptions, and test reports to keep them organized
          </p>
          <Button onClick={() => document.getElementById('file-upload')?.click()}>
            Upload First Record
          </Button>
        </div>
      )}
    </div>
  );
};

export default HealthVault; 