import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { apiRequest } from "@/lib/queryClient";
import { Search, MoreHorizontal, Plus, UserPlus, ArrowUpDown, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/users", page, limit, search],
    queryFn: async () => {
      try {
        // Using the API request function with the proper signature
        const response = await apiRequest(
          "GET", 
          `/api/admin/users?limit=${limit}&offset=${(page - 1) * limit}${search ? `&search=${search}` : ""}`
        );
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch users:", error);
        return { users: [], total: 0 };
      }
    },
  });

  useEffect(() => {
    if (data) {
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    }
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const totalPages = Math.ceil(totalUsers / limit);

  // Sample mock data for demonstration
  const mockUsers: User[] = [
    {
      id: 1,
      username: "john_doe",
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "admin",
      isEmailVerified: true,
      createdAt: "2023-01-15T10:30:00Z",
      lastLogin: "2023-05-10T14:22:00Z"
    },
    {
      id: 2,
      username: "jane_smith",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Smith",
      role: "customer",
      isEmailVerified: true,
      createdAt: "2023-02-20T15:45:00Z",
      lastLogin: "2023-05-09T09:15:00Z"
    },
    {
      id: 3,
      username: "mike_johnson",
      email: "mike@example.com",
      firstName: "Mike",
      lastName: "Johnson",
      role: "customer",
      isEmailVerified: false,
      createdAt: "2023-03-10T08:20:00Z",
      lastLogin: "2023-05-01T11:30:00Z"
    },
    {
      id: 4,
      username: "sara_williams",
      email: "sara@example.com",
      firstName: "Sara",
      lastName: "Williams",
      role: "customer",
      isEmailVerified: true,
      createdAt: "2023-04-05T12:10:00Z",
      lastLogin: "2023-05-08T16:45:00Z"
    },
    {
      id: 5,
      username: "robert_brown",
      email: "robert@example.com",
      firstName: "Robert",
      lastName: "Brown",
      role: "customer",
      isEmailVerified: true,
      createdAt: "2023-04-15T09:30:00Z",
      lastLogin: "2023-05-05T10:20:00Z"
    }
  ];

  // For demo purposes, use mock data if API isn't working yet
  const displayUsers = users.length > 0 ? users : mockUsers;

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form onSubmit={handleSearch} className="flex w-full md:w-96 space-x-2">
            <Input
              type="search"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="outline" size="icon">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>

          <Button 
            className="shrink-0" 
            onClick={() => navigate("/admin/users/add")}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            <span>Add User</span>
          </Button>
        </div>

        <div className="bg-white rounded-md shadow">
          <Table>
            <TableCaption>List of all registered users</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>
                  <div className="flex items-center">
                    User
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <div className="flex items-center">
                    Joined
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                      <span className="ml-2">Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-gray-500">No users found</p>
                    <Button variant="link" onClick={() => setSearch("")}>
                      Clear search
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                displayUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-gray-500">#{user.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                          {user.firstName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username}
                          </p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "default" : "outline"}
                        className={
                          user.role === "admin"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                        }
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.isEmailVerified ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-600">
                          <XCircle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Unverified</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit user</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => alert("This would delete the user in a real app")}
                          >
                            Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNumber);
                        }}
                        isActive={pageNumber === page}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p>
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Username</p>
                  <p>@{selectedUser.username}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{selectedUser.email}</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <Badge
                    variant={selectedUser.role === "admin" ? "default" : "outline"}
                    className={
                      selectedUser.role === "admin"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                    }
                  >
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Verification Status</p>
                  {selectedUser.isEmailVerified ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Email Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600">
                      <XCircle className="h-4 w-4 mr-1" />
                      <span>Email Not Verified</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Created</p>
                  <p>
                    {new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Login</p>
                  <p>
                    {selectedUser.lastLogin
                      ? new Date(selectedUser.lastLogin).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button>Edit User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;