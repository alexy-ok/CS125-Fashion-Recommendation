import { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  Accordion,
  Box,
  Button,
  Container,
  Field,
  Heading,
  Input,
  NativeSelect,
  RadioGroup,
  Text,
  Textarea,
  VStack,
  Grid,
  Spinner,
  Image,
  Badge,
} from "@chakra-ui/react";
import { MdEdit, MdSearch } from "react-icons/md";

const API_BASE = "http://localhost:3000/api";

export interface ClothingProfile {
  id: string;
  title: string;
  description: string;
  minPrice: string;
  maxPrice: string;
  brandPreference: "high-end" | "casual" | null;
  material: string;
  shirtSize: string;
  pantsSize: string;
}

export interface SearchResult {
  item: {
    brand_store: string,
    category: string,
    data_source: string,
    description: string,
    docId: number,
    image_urls: string[],
    material: string,
    name: string,
    price: number | null,
    sizes: string[],
  }
  score: number
  // id: string;
  // title: string;
  // price: number;
  // currency: string;
  // image: string;
  // condition: string;
  // itemWebUrl: string;
  // seller: string;
  // shippingCost: string | number;


}

type AuthUser = { id: string; username: string };

const MATERIAL_OPTIONS = [
  { value: "", label: "No preference" },
  { value: "cotton", label: "Cotton" },
  { value: "polyester", label: "Polyester" },
  { value: "wool", label: "Wool" },
  { value: "silk", label: "Silk" },
  { value: "linen", label: "Linen" },
  { value: "denim", label: "Denim" },
  { value: "leather", label: "Leather" },
  { value: "rayon", label: "Rayon" },
  { value: "nylon", label: "Nylon" },
  { value: "blend", label: "Blend" },
];

const SHIRT_SIZES = [
  { value: "", label: "No preference" },
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
];

const PANTS_SIZES = [
  { value: "", label: "No preference" },
  { value: "28", label: "28" },
  { value: "29", label: "29" },
  { value: "30", label: "30" },
  { value: "31", label: "31" },
  { value: "32", label: "32" },
  { value: "33", label: "33" },
  { value: "34", label: "34" },
  { value: "36", label: "36" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
];

const createEmptyProfile = (): ClothingProfile => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  minPrice: "",
  maxPrice: "",
  brandPreference: null,
  material: "",
  shirtSize: "",
  pantsSize: "",
});

type ProfileFormDraft = Pick<
  ClothingProfile,
  | "description"
  | "minPrice"
  | "maxPrice"
  | "brandPreference"
  | "material"
  | "shirtSize"
  | "pantsSize"
>;

function StyleProfileAccordionItem({
  profile,
  index,
  onUpdate,
  onDelete,
  onSaveSuccess,
}: {
  profile: ClothingProfile;
  index: number;
  onUpdate: (id: string, updates: Partial<ClothingProfile>) => void;
  onDelete: (id: string) => void;
  onSaveSuccess?: () => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(profile.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<ProfileFormDraft>(() => ({
    description: profile.description,
    minPrice: profile.minPrice,
    maxPrice: profile.maxPrice,
    brandPreference: profile.brandPreference,
    material: profile.material,
    shirtSize: profile.shirtSize,
    pantsSize: profile.pantsSize,
  }));

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  const displayTitle =
    profile.title.trim() || `Style profile ${index + 1}`;

  const handleSaveTitle = () => {
    onUpdate(profile.id, { title: draftTitle.trim() });
    setIsEditingTitle(false);
  };

  const handleSaveProfile = () => {
    onUpdate(profile.id, { ...draft });
    onSaveSuccess?.();
  };

  return (
    <Accordion.Item value={profile.id} className="style-profile-item">
      <Accordion.ItemTrigger className="style-profile-trigger">
        <Box
          as="span"
          display="flex"
          alignItems="center"
          gap="2"
          flex="1"
          minW="0"
          onClick={(e: React.MouseEvent) => isEditingTitle && e.stopPropagation()}
        >
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              size="sm"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveTitle();
                }
                if (e.key === "Escape") {
                  setDraftTitle(profile.title);
                  setIsEditingTitle(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder={`Style profile ${index + 1}`}
              className="profile-title-input"
            />
          ) : (
            <Text as="span" fontWeight="medium" truncate>
              {displayTitle}
            </Text>
          )}
          {!isEditingTitle && (
            <Box
              as="span"
              role="button"
              tabIndex={0}
              aria-label="Edit profile title"
              fontSize="xs"
              p="1"
              borderRadius="sm"
              color="fg.muted"
              bg="transparent"
              cursor="pointer"
              flexShrink={0}
              _hover={{ bg: "bg.muted", color: "fg" }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDraftTitle(profile.title);
                setIsEditingTitle(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setDraftTitle(profile.title);
                  setIsEditingTitle(true);
                }
              }}
              className="edit-title-btn"
            >
              <MdEdit />
            </Box>
          )}
        </Box>
        <Button
          size="xs"
          variant="outline"
          colorPalette="red"
          flexShrink={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const ok = window.confirm(`Delete "${displayTitle}"? This cannot be undone.`);
            if (ok) onDelete(profile.id);
          }}
        >
          Delete
        </Button>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody pt="2" pb="4">
          <VStack gap="4" align="stretch">
            <Field.Root>
              <Field.Label>Description / keywords</Field.Label>
              <Textarea
                placeholder="e.g. affordable casual essentials, minimal basics..."
                value={draft.description}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
              <Field.HelperText>
                What style or type of clothing are you looking for?
              </Field.HelperText>
            </Field.Root>

            <Box className="price-range">
              <Text fontWeight="medium" mb="2">
                Price range (optional)
              </Text>
              <Box display="flex" gap="3" flexWrap="wrap" alignItems="center">
                <Field.Root width="min(140px, 100%)">
                  <Field.Label>Min ($)</Field.Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={draft.minPrice}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, minPrice: e.target.value }))
                    }
                  />
                </Field.Root>
                <Field.Root width="min(140px, 100%)">
                  <Field.Label>Max ($)</Field.Label>
                  <Input
                    type="number"
                    placeholder="Any"
                    min={0}
                    value={draft.maxPrice}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, maxPrice: e.target.value }))
                    }
                  />
                </Field.Root>
              </Box>
            </Box>

            <Field.Root>
              <Field.Label>Brand style (optional)</Field.Label>
              <RadioGroup.Root
                value={draft.brandPreference ?? ""}
                onValueChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    brandPreference: e.value
                      ? (e.value as "high-end" | "casual")
                      : null,
                  }))
                }
              >
                <Box display="flex" gap="4" flexWrap="wrap">
                  <RadioGroup.Item as="label" value="high-end" cursor="pointer">
                    <RadioGroup.ItemControl />
                    <RadioGroup.ItemText>High end brand</RadioGroup.ItemText>
                    <RadioGroup.ItemHiddenInput />
                  </RadioGroup.Item>
                  <RadioGroup.Item as="label" value="casual" cursor="pointer">
                    <RadioGroup.ItemControl />
                    <RadioGroup.ItemText>Casual</RadioGroup.ItemText>
                    <RadioGroup.ItemHiddenInput />
                  </RadioGroup.Item>
                </Box>
              </RadioGroup.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Main material (optional)</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={draft.material}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, material: e.target.value }))
                  }
                >
                  {MATERIAL_OPTIONS.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Box display="flex" gap="4" flexWrap="wrap" className="size-fields">
              <Field.Root flex="1" minWidth="min(160px, 100%)">
                <Field.Label>Shirt size (optional)</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={draft.shirtSize}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, shirtSize: e.target.value }))
                    }
                  >
                    {SHIRT_SIZES.map((opt) => (
                      <option key={opt.value || "none"} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root flex="1" minWidth="min(160px, 100%)">
                <Field.Label>Pants size (optional)</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={draft.pantsSize}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, pantsSize: e.target.value }))
                    }
                  >
                    {PANTS_SIZES.map((opt) => (
                      <option key={opt.value || "none"} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            </Box>

            <Button
              onClick={handleSaveProfile}
              colorPalette="blue"
              alignSelf="flex-start"
              className="save-profile-btn"
            >
              Save
            </Button>
          </VStack>
        </Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthBusy, setIsAuthBusy] = useState(false);

  const [profiles, setProfiles] = useState<ClothingProfile[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string>("");
  const [personalModelJson, setPersonalModelJson] = useState<string>("");
  const [isLoadingPersonalModel, setIsLoadingPersonalModel] = useState(false);

  const refreshMe = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`);
      if (!res.ok) {
        setAuthUser(null);
        return;
      }
      const data = await res.json();
      setAuthUser(data.user ?? null);
    } catch {
      setAuthUser(null);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const submitAuth = async () => {
    setAuthError("");
    setIsAuthBusy(true);
    try {
      const endpoint = authMode === "signup" ? "/auth/signup" : "/auth/login";
      console.log("endpoint: ", `${API_BASE}${endpoint}`);
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Auth failed");
      setAuthUser(data.user);
      setAuthPassword("");
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Auth failed");
      setAuthUser(null);
    } finally {
      setIsAuthBusy(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
    } finally {
      setAuthUser(null);
    }
  };

  const trackInteraction = async (
    eventType: "click" | "save" | "notMyStyle" | "skipQuick" | "purchase",
    item: SearchResult["item"],
    profileIdOverride?: string
  ) => {
    if (!authUser) return;
    const pid = profileIdOverride ?? selectedProfileId;
    if (!pid) return;
    try {
      await fetch(`${API_BASE}/profile-interaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          item,
        }),
      });

      // Refresh the debug model after updates
      await refreshPersonalModel();
    } catch {
      // ignore interaction failures (shouldn't block browsing)
    }
  };

  const refreshPersonalModel = async () => {
    if (!authUser) {
      setPersonalModelJson("");
      return;
    }
    setIsLoadingPersonalModel(true);
    try {
      const res = await fetch(`${API_BASE}/user-model`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load personal model");
      setPersonalModelJson(JSON.stringify(data.model, null, 2));
    } catch {
      setPersonalModelJson("");
    } finally {
      setIsLoadingPersonalModel(false);
    }
  };

  const handleAddProfile = () => {
    const newProfile = createEmptyProfile();
    setProfiles((prev) => [...prev, newProfile]);
    setExpandedIds((prev) => [...prev, newProfile.id]);
  };

  const handleUpdateProfile = (id: string, updates: Partial<ClothingProfile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setExpandedIds((prev) => prev.filter((pid) => pid !== id));
    if (selectedProfileId === id) {
      setSelectedProfileId("");
      setSearchResults([]);
      setSearchError("");
      setPersonalModelJson("");
    }
  };

  useEffect(() => {
    if (!authUser) {
      setPersonalModelJson("");
      return;
    }
    refreshPersonalModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, selectedProfileId]);

  const buildSearchQuery = (profile: ClothingProfile): string => {
    const parts: string[] = [];
    
    if (profile.description) {
      parts.push(profile.description);
    }
    
    if (profile.material) {
      parts.push(profile.material);
    }
    
    if (profile.brandPreference === "high-end") {
      parts.push("luxury designer brand");
    } else if (profile.brandPreference === "casual") {
      parts.push("casual everyday");
    }
    
    return parts.join(" ") || "clothing";
  };

  const handleSearch = async () => {
    if (!authUser) {
      setSearchError("Please log in first");
      return;
    }
    if (!selectedProfileId) {
      setSearchError("Please select a profile to search");
      return;
    }

    const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
    if (!selectedProfile) {
      setSearchError("Selected profile not found");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const searchQuery = buildSearchQuery(selectedProfile);
      const params = new URLSearchParams({
        query: searchQuery,
        limit: "20",
        profileId: selectedProfileId,
      });

      // Add optional filters
      if (selectedProfile.minPrice) {
        params.append("minPrice", selectedProfile.minPrice);
      }
      if (selectedProfile.maxPrice) {
        params.append("maxPrice", selectedProfile.maxPrice);
      }
      
      if (selectedProfile.brandPreference) {
        params.append("style", selectedProfile.brandPreference === "high-end" ? "expensive" : "casual");
      }
      
      if (selectedProfile.material) {
        params.append("material", selectedProfile.material);
      }
      
      if (selectedProfile.shirtSize) {
        params.append("shirt_size", selectedProfile.shirtSize);
      }
      
      if (selectedProfile.pantsSize) {
        params.append("pant_size", selectedProfile.pantsSize);
      }

      const response = await fetch(`${API_BASE}/recommend?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("data: ", data);
      setSearchResults(data.results || []);
      
      if (!data.results || data.results.length === 0) {
        setSearchError("No items found. Try adjusting your profile filters.");
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(
        error instanceof Error ? error.message : "Failed to search products"
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Container maxW="container.xl" py="10">
      {!authUser ? (
        <Box maxW="md" mx="auto" borderWidth="1px" borderRadius="xl" p={{ base: "5", md: "7" }}>
          <VStack gap="5" align="stretch">
            <Box>
              <Heading size="lg">Sign in</Heading>
              <Text color="fg.muted" mt="1">
                Create an account or log in to personalize recommendations.
              </Text>
            </Box>

            <RadioGroup.Root
              value={authMode}
              onValueChange={(e) => setAuthMode((e.value as "login" | "signup") ?? "login")}
            >
              <Grid templateColumns="1fr 1fr" gap="2">
                <RadioGroup.Item value="login">
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText>Login</RadioGroup.ItemText>
                </RadioGroup.Item>
                <RadioGroup.Item value="signup">
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText>Sign up</RadioGroup.ItemText>
                </RadioGroup.Item>
              </Grid>
            </RadioGroup.Root>

            <Field.Root>
              <Field.Label>Username</Field.Label>
              <Input
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="e.g. kaino"
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Password</Field.Label>
              <Input
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
              />
            </Field.Root>

            <Button onClick={submitAuth} colorPalette="blue" disabled={isAuthBusy}>
              {isAuthBusy ? "…" : authMode === "signup" ? "Create account" : "Log in"}
            </Button>

            {authError && <Text color="red.500">{authError}</Text>}
          </VStack>
        </Box>
      ) : (
        <VStack gap="6" align="stretch">
          <Grid templateColumns={{ base: "1fr", md: "360px 1fr" }} gap="6" alignItems="start">
            {/* Left: profiles */}
            <Box>
              <Box borderWidth="1px" borderRadius="lg" p="4" mb="4">
                <Grid templateColumns="1fr auto" gap="3" alignItems="center">
                  <Box minW="0">
                    <Text fontWeight="medium" truncate>
                      Logged in as {authUser.username}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      Manage your style profiles
                    </Text>
                  </Box>
                  <Button onClick={logout} variant="outline" size="sm">
                    Log out
                  </Button>
                </Grid>
              </Box>

              <Grid templateColumns="1fr" gap="2">
                <Button onClick={handleAddProfile} colorPalette="blue" width="100%">
                  Add Style Profile
                </Button>
              </Grid>

              <Box mt="4">
                {profiles.length === 0 ? (
                  <Box
                    py="10"
                    px="4"
                    borderRadius="md"
                    borderWidth="1px"
                    borderStyle="dashed"
                    color="fg.muted"
                    textAlign="center"
                    className="empty-profiles"
                  >
                    No style profiles yet. Click &quot;Add Style Profile&quot; to create one.
                  </Box>
                ) : (
                  <Accordion.Root
                    multiple
                    collapsible
                    value={expandedIds}
                    onValueChange={(e) => setExpandedIds(e.value ?? [])}
                    className="profiles-accordion"
                  >
                    {profiles.map((profile, index) => (
                      <StyleProfileAccordionItem
                        key={profile.id}
                        profile={profile}
                        index={index}
                        onUpdate={handleUpdateProfile}
                        onDelete={handleDeleteProfile}
                        onSaveSuccess={() =>
                          setExpandedIds((prev) => prev.filter((id) => id !== profile.id))
                        }
                      />
                    ))}
                  </Accordion.Root>
                )}
              </Box>

              <Box mt="4" borderWidth="1px" borderRadius="lg" p="4">
                <Text fontWeight="medium" mb="2">
                  Personal model stats
                </Text>
                {!selectedProfileId ? (
                  <Text fontSize="sm" color="fg.muted">
                    Select a profile to start interacting. The model shown is per-user.
                  </Text>
                ) : isLoadingPersonalModel ? (
                  <Text fontSize="sm" color="fg.muted">
                    Loading…
                  </Text>
                ) : (
                  <Textarea
                    value={personalModelJson || ""}
                    readOnly
                    rows={10}
                    fontFamily="mono"
                    fontSize="xs"
                  />
                )}
              </Box>
            </Box>

            {/* Right: search + results */}
            <Box>
              <Heading size="lg" mb="2">
                Clothing recommendations
              </Heading>
              <Text color="fg.muted" mb="4">
                Pick a style profile on the left, then search and refine results here.
              </Text>

              <Box p="6" borderRadius="lg" borderWidth="1px" bg="bg.subtle" className="search-section">
                <VStack gap="4" align="stretch">
                  <Heading size="md">Search</Heading>
                  <Field.Root>
                    <Field.Label>Selected Profile</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                      >
                        <option value="">Choose a profile...</option>
                        {profiles.map((profile, index) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.title.trim() || `Style profile ${index + 1}`}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>

                  <Button
                    onClick={handleSearch}
                    colorPalette="green"
                    disabled={!selectedProfileId || isSearching}
                    loading={isSearching}
                    className="search-btn"
                  >
                    <MdSearch />
                    Search Items
                  </Button>

                  {searchError && (
                    <Box p="3" borderRadius="md" bg="red.50" color="red.700" fontSize="sm">
                      {searchError}
                    </Box>
                  )}
                </VStack>
              </Box>

              {isSearching && (
                <Box textAlign="center" py="8">
                  <Spinner size="lg" colorPalette="blue" />
                  <Text mt="4" color="fg.muted">
                    Searching for items...
                  </Text>
                </Box>
              )}

              {!isSearching && searchResults.length > 0 && (
                <Box mt="6">
                  <Heading size="md" mb="4">
                    Results ({searchResults.length})
                  </Heading>
                  <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap="6" className="results-grid">
                    {searchResults.map((item) => (
                      <Box
                        key={item.item.docId}
                        borderRadius="lg"
                        borderWidth="1px"
                        overflow="hidden"
                        bg="bg.surface"
                        transition="all 0.2s"
                        _hover={{ transform: "translateY(-4px)", shadow: "lg" }}
                        className="result-item"
                        onClick={() => trackInteraction("click", item.item)}
                      >
                        {item.item.image_urls && (
                          <Image
                            src={item.item.image_urls[0]}
                            alt={item.item.name}
                            width="100%"
                            height="200px"
                            objectFit="cover"
                          />
                        )}
                        <Box p="4">
                          <Text fontWeight="semibold" fontSize="sm" lineClamp={2} mb="2" minHeight="40px">
                            {item.item.name}
                          </Text>
                          <Text fontSize="xl" fontWeight="bold" color="green.600" mb="2">
                            ${item.item.price}
                          </Text>
                          <Box display="flex" gap="2" mb="3" flexWrap="wrap">
                            {item.item.material && (
                              <Badge size="sm" colorPalette="blue">
                                {item.item.material}
                              </Badge>
                            )}
                          </Box>
                          <Text fontSize="xs" color="fg.muted" mb="3">
                            Seller: {item.item.brand_store}
                          </Text>
                          <Grid templateColumns="1fr 1fr" gap="2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                trackInteraction("notMyStyle", item.item);
                              }}
                            >
                              Not my style
                            </Button>
                            <Button
                              size="sm"
                              colorPalette="blue"
                              onClick={(e) => {
                                e.stopPropagation();
                                trackInteraction("save", item.item);
                              }}
                            >
                              Save
                            </Button>
                          </Grid>
                        </Box>
                      </Box>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Grid>
        </VStack>
      )}
    </Container>
  );
}
