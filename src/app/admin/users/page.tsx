"use client";

import { useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { BrowserApiError, browserApi } from "@/lib/browser-api";
import type { User } from "@/types/user";

type Customer = User & { status: "active" | "blocked"; createdAt?: string };
type UserListResponse = {
  items: Customer[];
  total: number;
  page: number;
  pages: number;
};
type StatusFilter = "" | "active" | "blocked";

export default function AdminUsersPage() {
  const [hasAccess, setHasAccess] = useState(false);
  const [accessForbidden, setAccessForbidden] = useState(false);
  const [users, setUsers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("q", search);
    return browserApi<UserListResponse>(`/admin/users?${params.toString()}`);
  }, [page, search, statusFilter]);

  useEffect(() => {
    let active = true;
    browserApi<User>("/auth/me")
      .then((account) => {
        if (!active) return;
        if (account.role !== "super_admin" && account.role !== "admin") {
          setAccessForbidden(true);
          return;
        }
        setHasAccess(true);
      })
      .catch(() => {
        if (active) setAccessForbidden(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasAccess) return;
    let active = true;
    fetchUsers()
      .then((result) => {
        if (!active) return;
        setUsers(result.items);
        setTotal(result.total);
        setPages(result.pages);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof BrowserApiError && (err.status === 401 || err.status === 403)) {
          setAccessForbidden(true);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load customers");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchUsers, hasAccess]);

  async function changeStatus(user: Customer) {
    const nextStatus = user.status === "active" ? "blocked" : "active";
    const action = nextStatus === "blocked" ? "block" : "reactivate";
    if (!confirm(`Are you sure you want to ${action} ${user.name}'s account?`)) return;

    setBusyUserId(user.id);
    setError("");
    setNotice("");
    try {
      await browserApi(`/admin/users/${user.id}/${nextStatus === "blocked" ? "block" : "activate"}`, {
        method: "POST",
      });
      setNotice(`${user.name}'s account has been ${nextStatus === "blocked" ? "blocked" : "reactivated"}.`);
      const result = await fetchUsers();
      setUsers(result.items);
      setTotal(result.total);
      setPages(result.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} customer`);
    } finally {
      setBusyUserId("");
    }
  }

  if (accessForbidden) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Access restricted</h1>
        <p className="mt-3 text-sm text-mist">Administrator privileges are required to manage customer accounts.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-mist">Store administration</p>
          <h1 className="mt-1 font-display text-4xl">Customer accounts</h1>
          <p className="mt-2 text-sm text-mist">Search, review, and manage customer access. Vendor accounts are managed in Sellers.</p>
        </div>
        <p className="text-sm text-mist">{total} customer{total === 1 ? "" : "s"}</p>
      </div>

      <AdminNav />

      {notice && <p role="status" className="mb-6 border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <form
        className="mb-6 flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <label className="sr-only" htmlFor="customer-search">Search customers</label>
        <input
          id="customer-search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search name, email, or phone"
          className="min-w-60 flex-1 border border-black/15 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-black px-5 py-2 text-xs uppercase tracking-wider text-white hover:bg-charcoal">
          Search
        </button>
        <label className="sr-only" htmlFor="customer-status">Filter by status</label>
        <select
          id="customer-status"
          value={statusFilter}
          onChange={(event) => {
            setLoading(true);
            setError("");
            setStatusFilter(event.target.value as StatusFilter);
            setPage(1);
          }}
          className="border border-black/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </form>

      {loading ? (
        <p className="py-12 text-center text-sm text-mist">Loading customers…</p>
      ) : users.length === 0 ? (
        <div className="border border-black/10 bg-stone p-12 text-center">
          <p className="text-sm text-mist">No customer accounts found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-black/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-stone text-xs uppercase tracking-wider text-charcoal">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-stone/50">
                    <td className="px-4 py-3.5 font-medium">{user.name}</td>
                    <td className="px-4 py-3.5 text-xs text-mist">
                      <p>{user.email}</p>
                      {user.phone && <p>{user.phone}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-mist">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-wider ${
                        user.status === "active" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        disabled={busyUserId === user.id}
                        onClick={() => void changeStatus(user)}
                        className="border border-black/15 px-3 py-1.5 text-xs uppercase tracking-wider hover:bg-stone disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyUserId === user.id ? "Saving…" : user.status === "active" ? "Block" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex items-center justify-between text-sm">
            <p className="text-mist">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current - 1);
                }}
                className="border border-black/15 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current + 1);
                }}
                className="border border-black/15 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
