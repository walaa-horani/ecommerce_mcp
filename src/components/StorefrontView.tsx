'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppState, Product, CartItem } from '@/context/AppStateContext';

export default function StorefrontView() {
  const { state, addToCart, updateCartQty, removeFromCart, checkout, loginCustomer, logoutCustomer } = useAppState();

  // Sync real Supabase auth session into the storefront so navbar + cart gating reflect
  // the actual signed-in customer, not mock state.
  useEffect(() => {
    const supabase = createClient();

    const sync = (user: { email?: string } | null) => {
      if (user?.email) {
        loginCustomer(user.email.split('@')[0], user.email);
      } else {
        logoutCustomer();
      }
    };

    supabase.auth.getUser().then(({ data }) => sync(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      sync(session?.user ?? null)
    );

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRealSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logoutCustomer();
  };
  
  const [subView, setSubView] = useState<'home' | 'detail' | 'cart' | 'checkout' | 'success' | 'orders' | 'auth'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Checkout Form State
  const [address, setAddress] = useState('123 Commerce St, Suite 400');
  const [city, setCity] = useState('Metropolis');
  const [zip, setZip] = useState('10001');
  const [country, setCountry] = useState('United States');
  const [fullName, setFullName] = useState('Jane Doe');

  // Inline auth gate message state
  const [showAuthGate, setShowAuthGate] = useState(false);
  type PostAuthAction =
    | { type: 'add_to_cart'; payload: { product: Product; qty: number } }
    | { type: 'view_cart'; payload: null };
  const [postAuthAction, setPostAuthAction] = useState<PostAuthAction | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');

  const categories = ['All', 'Electronics', 'Audio', 'Office', 'Accessories'];

  const filteredProducts = state.products.filter(p => {
    const matchesCategory = categoryFilter === 'All' || 
      (categoryFilter === 'Electronics' && p.sku.includes('KB') || p.sku.includes('SEN')) ||
      (categoryFilter === 'Audio' && p.sku.includes('HP') || p.sku.includes('LP')) ||
      (categoryFilter === 'Office' && p.sku.includes('CH'));
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && p.isPublished;
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setSubView('detail');
  };

  const handleAddToCart = (product: Product, qty: number) => {
    if (!state.currentUser) {
      setPostAuthAction({ type: 'add_to_cart', payload: { product, qty } });
      setShowAuthGate(true);
      setSubView('auth');
      return;
    }
    addToCart(product, qty);
  };

  const handleCartClick = () => {
    if (!state.currentUser) {
      setPostAuthAction({ type: 'view_cart', payload: null });
      setSubView('auth');
      return;
    }
    setSubView('cart');
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signin') {
      loginCustomer(fullName || 'Jane Doe', email || 'jane.doe@example.com');
    } else {
      loginCustomer(name || 'Jane Doe', email);
    }
    setShowAuthGate(false);
    
    // Process queued action
    if (postAuthAction) {
      if (postAuthAction.type === 'add_to_cart') {
        addToCart(postAuthAction.payload.product, postAuthAction.payload.qty);
        setSubView('cart');
      } else if (postAuthAction.type === 'view_cart') {
        setSubView('cart');
      }
      setPostAuthAction(null);
    } else {
      setSubView('home');
    }
  };

  const handlePlaceOrder = () => {
    checkout(`${fullName}, ${address}, ${city}, ${zip}, ${country}`);
    setLastOrderNumber(`KL-${Math.floor(100000 + Math.random() * 900000)}`);
    setSubView('success');
  };

  // Group cart items by vendor
  const groupedCartItems: { [key: string]: CartItem[] } = {};
  state.cart.forEach(item => {
    const vendorName = item.product.vendor;
    if (!groupedCartItems[vendorName]) {
      groupedCartItems[vendorName] = [];
    }
    groupedCartItems[vendorName].push(item);
  });

  const cartSubtotal = state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-8 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => setSubView('home')} className="flex items-center gap-2 cursor-pointer">
              <span className="h-8 w-8 bg-indigo-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">KL</span>
              <span className="font-bold text-lg text-slate-900 tracking-tight">Kinetic Ledger</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, brands, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
              <svg className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSubView('orders')}
                  className="text-sm font-medium text-slate-700 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs uppercase">
                    {state.currentUser.name.charAt(0)}
                  </span>
                  <span className="hidden sm:inline">My Orders</span>
                </button>
                <button
                  onClick={handleRealSignOut}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/account/login"
                  className="text-sm font-medium text-slate-700 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign In
                </Link>
                <Link
                  href="/account/login?mode=signup"
                  className="text-sm font-semibold bg-indigo-800 hover:bg-indigo-900 text-white px-4 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <button
              onClick={handleCartClick}
              className="relative p-2 text-slate-600 hover:text-indigo-800 transition cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {state.cart.length > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                  {state.cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* VIEW: HOME */}
        {subView === 'home' && (
          <div className="space-y-8">
            {/* Hero banner */}
            <div className="bg-indigo-900 text-white rounded-xl overflow-hidden shadow-sm relative py-12 px-8 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-950">
              <div className="max-w-xl space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                  Shop from independent vendors, all in one place
                </h1>
                <p className="text-indigo-200 text-sm md:text-base">
                  Kinetic Ledger bridges operational inventory with premium retail. Authentic products direct from registered vendors.
                </p>
                <button
                  onClick={() => {
                    const el = document.getElementById('products-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#D97706] hover:bg-amber-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm transition"
                >
                  Browse Products
                </button>
              </div>
              <div className="hidden md:block w-72 h-44 rounded-lg overflow-hidden border border-indigo-850 bg-indigo-800 flex items-center justify-center relative">
                <span className="text-5xl font-extrabold text-indigo-950 absolute -bottom-5 -right-5 opacity-40">LEDGER</span>
                <span className="text-indigo-300 font-medium text-xs tracking-wider uppercase">Official Storefront</span>
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Filter:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-800 border-indigo-800 text-white shadow-sm'
                      : 'bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div id="products-section" className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-[#E2E8F0] pb-2">Featured Products</h2>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-[#E2E8F0] text-slate-500 text-sm">
                  No products found matching your filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => {
                    const isLowStock = product.stock > 0 && product.stock <= 3;
                    const isOut = product.stock === 0;

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden hover:shadow-md transition flex flex-col group cursor-pointer"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="aspect-video relative overflow-hidden bg-slate-100 border-b border-[#E2E8F0]">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          
                          {/* Low stock badge */}
                          {isLowStock && (
                            <span className="absolute top-2 left-2 bg-amber-50 text-[#D97706] border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Low Stock ({product.stock})
                            </span>
                          )}
                          {isOut && (
                            <span className="absolute top-2 left-2 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Out of Stock
                            </span>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                              Sold by {product.vendor}
                            </span>
                            <h3 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-800 line-clamp-1 mt-0.5">
                              {product.name}
                            </h3>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-2">
                            <span className="text-base font-bold text-[#D97706] tabular-nums">
                              ${product.price.toFixed(2)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isOut) handleAddToCart(product, 1);
                              }}
                              disabled={isOut}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition ${
                                isOut 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-[#D97706] hover:bg-amber-700 text-white cursor-pointer'
                              }`}
                            >
                              {isOut ? 'Sold Out' : 'Add to Cart'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: PRODUCT DETAIL */}
        {subView === 'detail' && selectedProduct && (
          <div className="space-y-6">
            <button
              onClick={() => setSubView('home')}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Catalog
            </button>

            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden border border-[#E2E8F0]">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-indigo-700 tracking-wide uppercase">
                      Sold by {selectedProduct.vendor}
                    </span>
                    <h1 className="text-2xl font-bold text-slate-900 mt-1">
                      {selectedProduct.name}
                    </h1>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-[#D97706] tabular-nums">
                      ${selectedProduct.price.toFixed(2)}
                    </span>
                    {selectedProduct.stock > 0 ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        In Stock ({selectedProduct.stock})
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="space-y-3 pt-6 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Quantity</span>
                    <div className="flex items-center border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] py-1 px-3">
                      <span className="text-sm font-semibold text-slate-800 tabular-nums">1</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(selectedProduct, 1)}
                    disabled={selectedProduct.stock === 0}
                    className={`w-full text-center font-bold py-3 rounded-lg shadow-sm transition ${
                      selectedProduct.stock === 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-[#D97706] hover:bg-amber-700 text-white cursor-pointer'
                    }`}
                  >
                    {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: AUTHENTICATION */}
        {subView === 'auth' && (
          <div className="max-w-md mx-auto my-12">
            {showAuthGate && (
              <div className="bg-amber-50 border-l-4 border-[#D97706] p-4 rounded-lg mb-6 shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-amber-800 font-medium">
                      Sign in to add items to your cart or complete checkout.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold text-slate-900">
                  {authMode === 'signin' ? 'Sign In to Shop' : 'Create Customer Account'}
                </h1>
                <p className="text-xs text-slate-400">
                  {authMode === 'signin' ? 'Welcome back! Enter credentials.' : 'Join Kinetic Ledger shopping.'}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@example.com"
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition text-sm cursor-pointer"
                >
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-[#E2E8F0]">
                {authMode === 'signin' ? (
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className="text-xs text-indigo-700 hover:underline cursor-pointer"
                  >
                    Don&apos;t have an account? Create one
                  </button>
                ) : (
                  <button 
                    onClick={() => setAuthMode('signin')}
                    className="text-xs text-indigo-700 hover:underline cursor-pointer"
                  >
                    Already have an account? Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CART */}
        {subView === 'cart' && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900 border-b border-[#E2E8F0] pb-2">Shopping Cart</h1>

            {state.cart.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-4 shadow-sm">
                <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="font-semibold text-slate-700 text-sm">Your cart is empty</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Add products to your cart and check out securely.</p>
                <button
                  onClick={() => setSubView('home')}
                  className="bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Line Items */}
                <div className="lg:col-span-2 space-y-6">
                  {Object.keys(groupedCartItems).map((vendorName) => (
                    <div key={vendorName} className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
                      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-2.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Sold by: {vendorName}
                        </span>
                      </div>
                      <div className="divide-y divide-[#E2E8F0]">
                        {groupedCartItems[vendorName].map((item) => (
                          <div key={item.product.id} className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="h-16 w-16 object-cover rounded-lg border border-[#E2E8F0]"
                              />
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                                  {item.product.name}
                                </h4>
                                <span className="text-xs text-slate-400 font-mono mt-0.5 block">{item.product.sku}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
                              <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden bg-[#F8FAFC]">
                                <button
                                  onClick={() => updateCartQty(item.product.id, Math.max(1, item.quantity - 1))}
                                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="px-3 text-sm font-medium text-slate-800 tabular-nums select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateCartQty(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-right">
                                <span className="text-sm font-bold text-slate-900 block tabular-nums">
                                  ${(item.product.price * item.quantity).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="text-[10px] text-rose-500 hover:underline font-semibold mt-0.5 cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 h-fit space-y-4">
                  <h3 className="font-bold text-slate-900 border-b border-[#E2E8F0] pb-2 text-sm uppercase tracking-wide">
                    Order Summary
                  </h3>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="tabular-nums">${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Shipping fee</span>
                      <span className="tabular-nums">FREE</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Estimated Tax (10%)</span>
                      <span className="tabular-nums">${(cartSubtotal * 0.1).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#E2E8F0] pt-4 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-slate-800">Total</span>
                    <span className="font-extrabold text-lg text-[#D97706] tabular-nums">
                      ${(cartSubtotal * 1.1).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSubView('checkout')}
                    className="w-full bg-[#D97706] hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition text-sm text-center cursor-pointer"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: CHECKOUT */}
        {subView === 'checkout' && (
          <div className="space-y-6">
            <button
              onClick={() => setSubView('cart')}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Cart
            </button>

            <h1 className="text-xl font-bold text-slate-900 border-b border-[#E2E8F0] pb-2 flex items-center gap-1.5">
              <svg className="h-5 w-5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure Checkout
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-950 text-sm uppercase tracking-wide border-b border-[#E2E8F0] pb-2">
                      Shipping Address
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ZIP / Postal Code</label>
                      <input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Country</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-600"
                      >
                        <option>United States</option>
                        <option>United Kingdom</option>
                        <option>Canada</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 space-y-4">
                  <h3 className="font-semibold text-slate-950 text-sm uppercase tracking-wide border-b border-[#E2E8F0] pb-2">
                    Payment Method
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-indigo-600 bg-indigo-50/20 p-4 rounded-lg flex items-center gap-3 cursor-pointer">
                      <input type="radio" defaultChecked className="text-indigo-600 focus:ring-indigo-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-950 block">Credit Card</span>
                        <span className="text-[10px] text-slate-500 block">Visa, Mastercard</span>
                      </div>
                    </div>
                    <div className="border border-[#E2E8F0] p-4 rounded-lg flex items-center gap-3 opacity-60 cursor-not-allowed">
                      <input type="radio" disabled className="text-indigo-600 focus:ring-indigo-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-950 block">PayPal</span>
                        <span className="text-[10px] text-slate-500 block">Fast check-out</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Summary */}
              <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 h-fit space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-[#E2E8F0] pb-2 text-sm uppercase tracking-wide">
                  Order Summary
                </h3>

                <div className="divide-y divide-[#E2E8F0]">
                  {state.cart.map((item) => (
                    <div key={item.product.id} className="py-2.5 flex justify-between text-xs gap-3">
                      <div>
                        <span className="font-medium text-slate-800 block">{item.product.name}</span>
                        <span className="text-[10px] text-slate-500 block">Qty: {item.quantity} · Sold by {item.product.vendor}</span>
                      </div>
                      <span className="font-semibold text-slate-800 tabular-nums">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#E2E8F0] pt-4 space-y-2 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="tabular-nums">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%)</span>
                    <span className="tabular-nums">${(cartSubtotal * 0.1).toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-[#E2E8F0] pt-4 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-slate-800">Total</span>
                  <span className="font-extrabold text-lg text-[#D97706] tabular-nums">
                    ${(cartSubtotal * 1.1).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-[#D97706] hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition text-sm flex items-center justify-center gap-1 cursor-pointer"
                >
                  Place Order
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: ORDER SUCCESS */}
        {subView === 'success' && (
          <div className="max-w-md mx-auto my-12 text-center">
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-8 space-y-6">
              <div className="mx-auto h-16 w-16 bg-emerald-50 text-[#059669] border border-emerald-200 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-bold text-slate-900">Order Placed Successfully!</h1>
                <p className="text-xs text-slate-500">
                  Thank you for shopping with Kinetic Ledger. Your order has been received and is being processed.
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 text-xs text-left space-y-2.5">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Order Number:</span>
                  <span className="font-bold text-slate-900 font-mono">#{lastOrderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Estimated Delivery:</span>
                  <span className="font-bold text-slate-900">Nov 15, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Shipping Address:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">{fullName}, {address}</span>
                </div>
              </div>

              <button
                onClick={() => setSubView('home')}
                className="w-full bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2.5 rounded-lg shadow-sm transition text-sm cursor-pointer"
              >
                Back to Storefront
              </button>
            </div>
          </div>
        )}

        {/* VIEW: MY ORDERS */}
        {subView === 'orders' && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900 border-b border-[#E2E8F0] pb-2">My Order History</h1>

            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E2E8F0]">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date Placed</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Items</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E2E8F0] text-xs">
                    {state.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 font-mono">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">{order.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">{order.vendor}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{order.items.join(', ')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 tabular-nums">${order.total.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'Paid'
                              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              : order.status === 'Fulfilled'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : order.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-8 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Kinetic Ledger Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link
              href="/onboarding/create-store"
              className="text-slate-500 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Become a vendor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
