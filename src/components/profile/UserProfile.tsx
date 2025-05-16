
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUser } from '@/contexts/UserContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { LogOut } from 'lucide-react';
import { MedicalHistoryList } from './MedicalHistoryList';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  age: z.string().refine((val) => !val || !isNaN(Number(val)), {
    message: 'Age must be a number',
  }),
  gender: z.enum(['male', 'female', 'other']),
  phoneNumber: z.string().min(10, { message: 'Phone number is required' }),
  location: z.string().optional(),
});

const UserProfile = () => {
  const { currentUser, logout } = useUser();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || '',
      age: currentUser?.age ? String(currentUser.age) : '',
      gender: currentUser?.gender || 'male',
      phoneNumber: currentUser?.phoneNumber || '',
      location: currentUser?.location || '',
    },
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    // In a real app, this would call an API to update the user profile
    console.log('Updated profile:', values);
    
    setIsEditing(false);
    toast({
      title: 'Profile updated',
      description: 'Your profile information has been updated successfully.',
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Profile</CardTitle>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" form="profile-form">
                    Save
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit</Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isEditing ? (
            <Form {...form}>
              <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Your age" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-wrap gap-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="male" />
                              </FormControl>
                              <FormLabel className="font-normal">Male</FormLabel>
                            </FormItem>
                            
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="female" />
                              </FormControl>
                              <FormLabel className="font-normal">Female</FormLabel>
                            </FormItem>
                            
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="other" />
                              </FormControl>
                              <FormLabel className="font-normal">Other</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Your location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p>{currentUser?.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p>{currentUser?.age || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="capitalize">{currentUser?.gender || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p>{currentUser?.phoneNumber || 'Not specified'}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p>{currentUser?.location || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Medical History */}
      <MedicalHistoryList />
      
      <div className="pt-4">
        <Button 
          variant="destructive" 
          className="w-full flex items-center justify-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
