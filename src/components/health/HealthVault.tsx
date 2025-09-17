import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  File, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Share2, 
  Eye, 
  Filter,
  Calendar,
  Tag,
  FileText,
  Image,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { healthVaultService, HealthRecord } from '@/services/healthVaultService';
import { auth } from '@/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

const HealthVault: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();
  
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [storageStats, setStorageStats] = useState<{
    totalFiles: number;
    totalSize: number;
    categoryBreakdown: Record<HealthRecord['category'], number>;
  } | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'document' as HealthRecord['category'],
    tags: '',
    isPrivate: true,
    file: null as File | null
  });

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadHealthRecords();
      loadStorageStats();
    }
  }, [user]);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, selectedCategory]);

  const loadHealthRecords = async () => {
    try {
      setIsLoading(true);
      console.log('Loading health records...');
      
      const userRecords = await healthVaultService.getUserHealthRecords();
      console.log('Health records loaded:', userRecords);
      
      setRecords(userRecords);
      
      if (userRecords.length === 0) {
        console.log('No health records found for user');
      }
    } catch (error) {
      console.error('Error loading health records:', error);
      
      // Show more specific error messages
      let errorMessage = "Failed to load health records. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('index')) {
          errorMessage = "Database index is being created. Please wait a moment and refresh the page.";
        } else if (error.message.includes('permission')) {
          errorMessage = "Permission denied. Please make sure you're signed in.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await healthVaultService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(record => record.category === selectedCategory);
    }

    setFilteredRecords(filtered);
  };

  const handleFileUpload = async () => {
    if (!uploadForm.file || !uploadForm.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a title and select a file.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      const tags = uploadForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await healthVaultService.uploadHealthRecord(
        uploadForm.file,
        {
          title: uploadForm.title,
          description: uploadForm.description,
          category: uploadForm.category,
          tags,
          isPrivate: uploadForm.isPrivate
        }
      );

      toast({
        title: "Success",
        description: "Health record uploaded successfully!",
        variant: "default"
      });

      // Reset form and reload records
      setUploadForm({
        title: '',
        description: '',
        category: 'document',
        tags: '',
        isPrivate: true,
        file: null
      });
      setShowUploadDialog(false);
      await loadHealthRecords();
      await loadStorageStats();
    } catch (error) {
      console.error('Error uploading health record:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload health record.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this health record? This action cannot be undone.')) {
      return;
    }

    try {
      await healthVaultService.deleteHealthRecord(recordId);
      toast({
        title: "Success",
        description: "Health record deleted successfully.",
        variant: "default"
      });
      await loadHealthRecords();
      await loadStorageStats();
    } catch (error) {
      console.error('Error deleting health record:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete health record.",
        variant: "destructive"
      });
    }
  };

  const handleViewRecord = (record: HealthRecord) => {
    if (record.downloadURL) {
      window.open(record.downloadURL, '_blank');
    }
  };

  const handleDownloadRecord = (record: HealthRecord) => {
    if (record.downloadURL) {
      const link = document.createElement('a');
      link.href = record.downloadURL;
      link.download = record.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getCategoryIcon = (category: HealthRecord['category']) => {
    switch (category) {
      case 'prescription': return <FileText className="w-4 h-4" />;
      case 'lab-report': return <FileSpreadsheet className="w-4 h-4" />;
      case 'medical-image': return <Image className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground">
              Please sign in to access your health vault and manage your medical records.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Health Vault</h2>
          <p className="text-muted-foreground">Securely store and manage your health records</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Health Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter record title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value as HealthRecord['category'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="lab-report">Lab Report</SelectItem>
                    <SelectItem value="medical-image">Medical Image</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., diabetes, blood test, cardiology"
                />
              </div>
              
              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt,.csv,.xls,.xlsx"
                  onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max 50MB. Supports images, PDFs, and documents.
                </p>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={handleFileUpload}
                  disabled={isUploading || !uploadForm.file || !uploadForm.title.trim()}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Storage Stats */}
      {storageStats && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{storageStats.totalFiles}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatFileSize(storageStats.totalSize)}</div>
                <div className="text-sm text-muted-foreground">Storage Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{storageStats.categoryBreakdown.prescription}</div>
                <div className="text-sm text-muted-foreground">Prescriptions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{storageStats.categoryBreakdown['lab-report']}</div>
                <div className="text-sm text-muted-foreground">Lab Reports</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search health records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="prescription">Prescriptions</SelectItem>
                <SelectItem value="lab-report">Lab Reports</SelectItem>
                <SelectItem value="medical-image">Medical Images</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(record.category)}
                    <Badge variant="secondary" className="text-xs">
                      {record.category.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {record.uploadDate.toLocaleDateString()}
                  </div>
                </div>
                
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">{record.title}</h3>
                
                {record.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {record.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{record.fileName}</span>
                  <span>{formatFileSize(record.fileSize)}</span>
                </div>
                
                {record.tags && record.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {record.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {record.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{record.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRecord(record)}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadRecord(record)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRecord(record.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {searchTerm || selectedCategory !== 'all' ? 'No Records Found' : 'No Records Yet'}
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Upload your medical records, prescriptions, and test reports to keep them organized and secure.'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <Button onClick={() => setShowUploadDialog(true)}>
                Upload First Record
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthVault;