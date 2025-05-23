
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { userSchema } from "@/utils/schemas/userSchema";
import type { User, UserFormValues } from "@/types/user";

interface UserFormProps {
  onSubmit: (data: UserFormValues) => void;
  onCancel: () => void;
  initialData?: User;
  submitLabel?: string;
}

export function UserForm({ onSubmit, onCancel, initialData, submitLabel = "Add User" }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      employee_id: initialData?.employee_id ?? "",
      password: "",
      role: initialData?.role ?? "Tester",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter full name" 
                  className="border-cyber-teal/30 focus:border-cyber-blue text-white bg-muted"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter email address" 
                  className="border-cyber-teal/30 focus:border-cyber-blue text-white bg-muted"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="employee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Employee ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter employee ID" 
                  className="border-cyber-teal/30 focus:border-cyber-blue text-white bg-muted"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">
                {initialData ? "Password (leave blank to keep unchanged)" : "Password"}
              </FormLabel>
              <FormControl>
                <Input 
                  type="password"
                  placeholder={initialData ? "Enter new password or leave blank" : "Enter secure password"}
                  className="border-cyber-teal/30 focus:border-cyber-blue text-white bg-muted"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Role</FormLabel>
              <FormControl>
                <select 
                  className="w-full h-10 px-3 py-2 rounded-md border border-cyber-teal/30 bg-muted text-white focus:border-cyber-blue"
                  {...field}
                >
                  <option value="Tester">Tester</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="border-cyber-teal/30 text-white hover:text-white"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="cyber-button"
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
