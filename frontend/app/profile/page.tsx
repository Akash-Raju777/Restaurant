'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { CustomerGuard } from '@/components/auth-guard';
import { getSession, clearSession, apiRequest, UserSession, fetchAddresses, addAddress, updateAddress, deleteAddressApi, setDefaultAddress, Address } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { User, MapPin, Lock, LogOut, CheckCircle2, AlertCircle, Plus, Trash2, ShieldCheck, ShoppingBag, Edit, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [session, setSession] = useState<UserSession | null>(null);

  // Profile Form
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newHouse, setNewHouse] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newState, setNewState] = useState('Karnataka');
  const [newPincode, setNewPincode] = useState('560038');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [newDeliveryInstructions, setNewDeliveryInstructions] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Edit Address State
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [editHouse, setEditHouse] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editRecipientName, setEditRecipientName] = useState('');
  const [editRecipientPhone, setEditRecipientPhone] = useState('');
  const [editDeliveryInstructions, setEditDeliveryInstructions] = useState('');
  const [editIsDefault, setEditIsDefault] = useState(false);

  // Alerts
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.push('/');
      return;
    }
    setSession(s);
    setFullName(s.fullName || '');
    setEmail(s.email || '');

    // Fetch profile and addresses
    apiRequest<any>('/customer/profile')
      .then((p) => {
        setFullName(p.fullName || '');
        setPhoneNumber(p.phoneNumber || '');
      })
      .catch(() => {});

    fetchAddresses()
      .then((a) => setAddresses(a || []))
      .catch((err) => {
        console.debug('[Profile] Address fetch failed:', {
          hasSession: !!session,
          sessionId: session?.id,
          sessionRole: session?.role,
          error: err.message,
        });
      });
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setProfileSuccess('');
    try {
      await apiRequest('/customer/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, phoneNumber }),
      });
      setProfileSuccess('Profile details updated successfully.');
      if (session) {
        setSession({ ...session, fullName });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPasswordSuccess('');
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordSuccess('Password successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not change password.');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const added = await addAddress({
        houseDetails: newHouse,
        street: newStreet,
        area: newArea,
        city: newCity,
        state: newState,
        postalCode: newPincode,
        deliveryInstructions: newDeliveryInstructions || undefined,
        recipientName: newRecipientName || undefined,
        recipientPhone: newRecipientPhone || undefined,
        isDefault: addresses.length === 0,
      });
      setAddresses([...addresses, added]);
      setShowAddressForm(false);
      setNewHouse('');
      setNewStreet('');
      setNewArea('');
      setNewCity('Bengaluru');
      setNewState('Karnataka');
      setNewPincode('560038');
      setNewRecipientName('');
      setNewRecipientPhone('');
      setNewDeliveryInstructions('');
    } catch (err: any) {
      if (err.message?.includes('log in again')) {
        router.push('/');
        return;
      }
      setErrorMsg(err.message || 'Could not save address.');
    }
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id ?? null);
    setEditHouse(addr.houseDetails);
    setEditStreet(addr.street);
    setEditArea(addr.area);
    setEditCity(addr.city);
    setEditState(addr.state);
    setEditPincode(addr.postalCode);
    setEditRecipientName(addr.recipientName || '');
    setEditRecipientPhone(addr.recipientPhone || '');
    setEditDeliveryInstructions(addr.deliveryInstructions || '');
    setEditIsDefault(Boolean(addr.isDefault));
  };

  const handleSaveEditAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddressId === null) return;
    try {
      const updated = await updateAddress(editingAddressId, {
        houseDetails: editHouse,
        street: editStreet,
        area: editArea,
        city: editCity,
        state: editState,
        postalCode: editPincode,
        deliveryInstructions: editDeliveryInstructions || undefined,
        recipientName: editRecipientName || undefined,
        recipientPhone: editRecipientPhone || undefined,
        isDefault: editIsDefault,
      });
      setAddresses(addresses.map((a) => (a.id === updated.id ? updated : a)));
      setEditingAddressId(null);
    } catch (err: any) {
      if (err.message?.includes('log in again')) {
        router.push('/');
        return;
      }
      setErrorMsg(err.message || 'Could not update address.');
    }
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setEditHouse('');
    setEditStreet('');
    setEditArea('');
    setEditCity('');
    setEditState('');
    setEditPincode('');
    setEditRecipientName('');
    setEditRecipientPhone('');
    setEditDeliveryInstructions('');
    setEditIsDefault(false);
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await deleteAddressApi(id);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err: any) {
      if (err.message?.includes('log in again')) {
        router.push('/');
        return;
      }
      setErrorMsg(err.message || 'Could not delete address.');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const updated = await setDefaultAddress(id);
      setAddresses(addresses.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      if (err.message?.includes('log in again')) {
        router.push('/');
        return;
      }
      setErrorMsg(err.message || 'Could not set default address.');
    }
  };

  const handleLogout = () => {
    clearCart();
    clearSession();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex flex-col">
      <Navbar />

      <CustomerGuard>
        <main className="flex-1 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#201B14]">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-[#D9A441]/10 border border-[#D9A441]/40 flex items-center justify-center text-[#D9A441] text-2xl font-bold font-serif-luxury">
                {fullName ? fullName[0].toUpperCase() : 'G'}
              </div>
              <div>
                <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#F6F1E8]">
                  {fullName || 'Guest Profile'}
                </h1>
                <span className="text-xs text-[#AAA39A]">{email}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/orders"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#181511] border border-[#28221A] text-[#D9A441] hover:border-[#D9A441] flex items-center space-x-1.5 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>My Orders</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900 transition-colors flex items-center space-x-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Details */}
            <div className="bg-[#111111] border border-[#221D16] p-6 rounded-3xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-[#201B14]">
                <User className="w-4 h-4 text-[#D9A441]" />
                <h2 className="font-serif-luxury text-base font-bold text-[#F6F1E8]">Personal Details</h2>
              </div>

              {profileSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 text-xs text-emerald-300">
                  {profileSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[#888] font-semibold uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3.5 py-2 text-[#F6F1E8] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#888] font-semibold uppercase">Email Address (Immutable)</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-[#15120E] border border-[#201A12] text-[#777] rounded-xl px-3.5 py-2 outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#888] font-semibold uppercase">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3.5 py-2 text-[#F6F1E8] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold text-black orange-gradient-btn mt-2"
                >
                  Save Profile Changes
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-[#111111] border border-[#221D16] p-6 rounded-3xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-[#201B14]">
                <Lock className="w-4 h-4 text-[#FF9F43]" />
                <h2 className="font-serif-luxury text-base font-bold text-[#F6F1E8]">Security & Password</h2>
              </div>

              {passwordSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 text-xs text-emerald-300">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[#888] font-semibold uppercase">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3.5 py-2 text-[#F6F1E8] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#888] font-semibold uppercase">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3.5 py-2 text-[#F6F1E8] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold text-black orange-gradient-btn mt-2"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>

          {/* Delivery Addresses */}
          <div className="bg-[#111111] border border-[#221D16] p-6 sm:p-8 rounded-3xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[#201B14]">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#D9A441]" />
                <h2 className="font-serif-luxury text-lg font-bold text-[#F6F1E8]">
                  Saved Delivery Addresses
                </h2>
              </div>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-xs text-[#D9A441] hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddressForm ? 'Cancel' : 'Add New'}</span>
              </button>
            </div>

            {/* Add Address Form */}
            {showAddressForm && (
              <form onSubmit={handleAddAddress} className="p-4 bg-[#16130F] rounded-2xl border border-[#28221A] space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Recipient Name"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Recipient Phone"
                    value={newRecipientPhone}
                    onChange={(e) => setNewRecipientPhone(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="House / Flat / Building No."
                    value={newHouse}
                    onChange={(e) => setNewHouse(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Street / Road"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Area / Locality"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="PIN Code"
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <textarea
                    required={false}
                    rows={2}
                    placeholder="Delivery Instructions (optional)"
                    value={newDeliveryInstructions}
                    onChange={(e) => setNewDeliveryInstructions(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none sm:col-span-2"
                  />
                  <label className="flex items-center space-x-2 text-xs text-[#AAA39A]">
                    <input
                      type="checkbox"
                      checked={addresses.length === 0}
                      disabled
                      className="rounded text-[#D9A441]"
                    />
                    Set as default (first address)
                  </label>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-black orange-gradient-btn sm:col-span-2"
                >
                  Save Address
                </button>
              </form>
            )}

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-[#16130F] border border-[#241F18] p-4 rounded-2xl space-y-2 flex justify-between items-start"
                >
                  <div className="text-xs space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#F6F1E8] block">
                        {addr.recipientName || addr.recipientPhone || 'No Name'}
                      </span>
                      {addr.isDefault && (
                        <span className="inline-block text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    {addr.recipientName && addr.recipientPhone && (
                      <span className="text-[#888] block text-xs">
                        {addr.recipientPhone}
                      </span>
                    )}
                    {!addr.recipientName && addr.recipientPhone && (
                      <span className="text-[#888] block text-xs">
                        {addr.recipientPhone}
                      </span>
                    )}
                    <span className="text-[#F6F1E8] block text-sm font-medium mt-1">
                      {addr.houseDetails}, {addr.street}
                    </span>
                    <span className="text-[#AAA39A] block text-xs">
                      {addr.area}, {addr.city} - {addr.postalCode}
                    </span>
                    {addr.deliveryInstructions && (
                      <span className="text-[10px] text-[#D9A441] block mt-1 italic">
                        {addr.deliveryInstructions}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {!editingAddressId || editingAddressId !== addr.id ? (
                      <>
                        <button
                          onClick={() => handleEditAddress(addr)}
                          className="p-1.5 text-[#D9A441] hover:text-[#FF9F43] rounded-lg hover:bg-[#1C1813] transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefault(addr.id!)}
                            className="p-1.5 text-[#AAA39A] hover:text-emerald-400 rounded-lg hover:bg-[#1C1813] transition-colors"
                            title="Set as Default"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id!)}
                          className="p-1.5 text-[#666] hover:text-rose-400 rounded-lg hover:bg-[#1C1813] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={handleSaveEditAddress}
                          className="px-2 py-1 rounded-lg text-xs font-bold text-black orange-gradient-btn"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 text-[#666] hover:text-rose-400 rounded-lg hover:bg-[#1C1813] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Address Form (inline) */}
            {editingAddressId !== null && (
              <form onSubmit={handleSaveEditAddress} className="p-4 bg-[#16130F] rounded-2xl border border-[#D9A441]/50 space-y-3 text-xs sm:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Recipient Name"
                    value={editRecipientName}
                    onChange={(e) => setEditRecipientName(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Recipient Phone"
                    value={editRecipientPhone}
                    onChange={(e) => setEditRecipientPhone(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="House / Flat / Building No."
                    value={editHouse}
                    onChange={(e) => setEditHouse(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Street / Road"
                    value={editStreet}
                    onChange={(e) => setEditStreet(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Area / Locality"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="PIN Code"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none"
                  />
                  <textarea
                    required={false}
                    rows={2}
                    placeholder="Delivery Instructions (optional)"
                    value={editDeliveryInstructions}
                    onChange={(e) => setEditDeliveryInstructions(e.target.value)}
                    className="bg-[#111] border border-[#333] rounded-xl p-2.5 text-[#F6F1E8] outline-none sm:col-span-2"
                  />
                  <label className="flex items-center space-x-2 text-xs text-[#AAA39A] sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={editIsDefault}
                      onChange={(e) => setEditIsDefault(e.target.checked)}
                      className="rounded text-[#D9A441]"
                    />
                    Set as default address
                  </label>
                </div>
                <div className="flex justify-end sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#AAA39A] hover:text-[#CCC] bg-[#1C1813] border border-[#28221A]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ml-2 px-5 py-2 rounded-xl text-xs font-bold text-black orange-gradient-btn"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      </CustomerGuard>

      <Footer />
    </div>
  );
}
