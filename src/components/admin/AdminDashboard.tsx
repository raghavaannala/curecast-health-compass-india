
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Users, Clock } from 'lucide-react';
import { users, medicalRecords } from '@/services/mockData';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  
  // Mock export function
  const exportData = (type: 'users' | 'records') => {
    console.log(`Exporting ${type} data...`);
    // In a real app, this would generate and download a CSV file
    alert(`Exported ${type} data as CSV (mock)`);
  };
  
  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Manage users and view health data for your region.
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="records">Health Records</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="pt-4">
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => exportData('users')}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                        <TableCell>{user.location || 'N/A'}</TableCell>
                        <TableCell>
                          {format(new Date(user.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>A list of registered users.</TableCaption>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="records" className="pt-4">
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => exportData('records')}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Symptoms</TableHead>
                      <TableHead>Recommendation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicalRecords.map(record => {
                      const user = users.find(u => u.id === record.userId);
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {user?.name || 'Unknown User'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {record.symptoms.slice(0, 2).map(symptom => (
                                <Badge key={symptom} variant="outline" className="capitalize">
                                  {symptom}
                                </Badge>
                              ))}
                              {record.symptoms.length > 2 && (
                                <Badge variant="outline">
                                  +{record.symptoms.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              record.recommendation === 'self-care' && "bg-green-500/20 text-green-500",
                              record.recommendation === 'clinic' && "bg-amber-500/20 text-amber-500",
                              record.recommendation === 'emergency' && "bg-red-500/20 text-red-500"
                            )}>
                              {record.recommendation}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableCaption>A list of health records from users.</TableCaption>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
