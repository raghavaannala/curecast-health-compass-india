import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useReminders } from '@/contexts/RemindersContext';
import { useUser } from '@/contexts/UserContext';
import { Separator } from '@/components/ui/separator';
import { Bell, Clock, Pill } from 'lucide-react';
import type { Reminder } from '@/types';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editReminder?: Reminder;
}

const reminderSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  type: z.enum(['medication', 'followup', 'vaccination']),
  date: z.string().min(1, { message: 'Date is required' }),
  time: z.string().min(1, { message: 'Time is required' }),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']),
  medication: z.object({
    name: z.string().optional(),
    dosage: z.string().optional(),
    instructions: z.string().optional(),
  }).optional(),
  notificationSettings: z.object({
    enablePush: z.boolean(),
    enableSMS: z.boolean(),
    enableEmail: z.boolean(),
    advanceNotice: z.number().min(0).max(180),
  }),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

const ReminderDialog = ({ open, onOpenChange, editReminder }: ReminderDialogProps) => {
  const { addReminder, updateReminder } = useReminders();
  const { user } = useUser();
  const [showMedicationFields, setShowMedicationFields] = useState(false);
  
  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: editReminder?.title || '',
      description: editReminder?.description || '',
      type: editReminder?.type || 'medication',
      date: editReminder?.date || new Date().toISOString().split('T')[0],
      time: editReminder?.time || '08:00',
      recurrence: editReminder?.recurrence || 'none',
      medication: editReminder?.medication || undefined,
      notificationSettings: editReminder?.notificationSettings || {
        enablePush: true,
        enableSMS: user?.notificationPreferences?.enableSMS || false,
        enableEmail: user?.notificationPreferences?.enableEmail || false,
        advanceNotice: user?.notificationPreferences?.reminderAdvanceNotice || 30,
      },
    },
  });
  
  const watchType = form.watch('type');
  
  useEffect(() => {
    setShowMedicationFields(watchType === 'medication');
  }, [watchType]);
  
  const onSubmit = (values: ReminderFormData) => {
    const reminderData = {
      title: values.title,
      description: values.description || '',
      type: values.type,
      date: values.date,
      time: values.time,
      recurrence: values.recurrence,
      dueDateTime: `${values.date}T${values.time}`,
      tags: [],
      medication: showMedicationFields ? values.medication : undefined,
      adherenceLog: [],
      completed: false,
      userId: user?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notificationSettings: values.notificationSettings,
    };
    
    if (editReminder) {
      updateReminder(editReminder.id, reminderData);
    } else {
      addReminder(reminderData);
    }
    
    form.reset();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            {editReminder ? 'Edit Reminder' : 'Create New Reminder'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Reminder title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add additional details..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="medication">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          <span>Medication</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="vaccination">Vaccination</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Date *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="h-11" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Time *</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        className="h-11" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repeat</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recurrence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">One time</SelectItem>
                      <SelectItem value="daily">Every day</SelectItem>
                      <SelectItem value="weekly">Every week</SelectItem>
                      <SelectItem value="monthly">Every month</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showMedicationFields && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Pill className="h-5 w-5 text-blue-600" />
                    Medication Details
                  </h4>
                  
                  <FormField
                    control={form.control}
                    name="medication.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medication Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter medication name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="medication.dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosage</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1 tablet, 5ml" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="medication.instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., Take with food" 
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
            
            <Separator className="my-6" />
            
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-600" />
                Notification Settings
              </h4>
              
              <FormField
                control={form.control}
                name="notificationSettings.enablePush"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 bg-white rounded-md border">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium">Push Notifications</FormLabel>
                      <FormDescription className="text-xs">
                        Receive notifications on your device
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notificationSettings.enableSMS"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 bg-white rounded-md border">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium">SMS Notifications</FormLabel>
                      <FormDescription className="text-xs">
                        Receive text message reminders
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notificationSettings.enableEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 bg-white rounded-md border">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium">Email Notifications</FormLabel>
                      <FormDescription className="text-xs">
                        Receive email reminders
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notificationSettings.advanceNotice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Advance Notice
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select advance notice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">At time of reminder</SelectItem>
                        <SelectItem value="5">5 minutes before</SelectItem>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                        <SelectItem value="120">2 hours before</SelectItem>
                        <SelectItem value="180">3 hours before</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="pt-6 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
              >
                {editReminder ? 'Update' : 'Create'} Reminder
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog;
