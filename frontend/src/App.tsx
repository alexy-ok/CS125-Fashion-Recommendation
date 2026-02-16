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
  id: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  condition: string;
  itemWebUrl: string;
  seller: string;
  shippingCost: string | number;
}

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
  onSaveSuccess,
}: {
  profile: ClothingProfile;
  index: number;
  onUpdate: (id: string, updates: Partial<ClothingProfile>) => void;
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
    setDraft({
      description: profile.description,
      minPrice: profile.minPrice,
      maxPrice: profile.maxPrice,
      brandPreference: profile.brandPreference,
      material: profile.material,
      shirtSize: profile.shirtSize,
      pantsSize: profile.pantsSize,
    });
  }, [profile.id, profile.description, profile.minPrice, profile.maxPrice, profile.brandPreference, profile.material, profile.shirtSize, profile.pantsSize]);

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
  const [profiles, setProfiles] = useState<ClothingProfile[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string>("");

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
      });

      // Add optional filters
      if (selectedProfile.minPrice || selectedProfile.maxPrice) {
        const minPrice = selectedProfile.minPrice || "0";
        const maxPrice = selectedProfile.maxPrice || "999999";
        params.append("filter", `price:[${minPrice}..${maxPrice}]`);
      }

      const response = await fetch(
        `http://localhost:3000/recommend?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      console.log(searchResults);
      if (data.results.length === 0) {
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
    <Container maxW="container.xl" py="8">
      <VStack gap="8" align="stretch">
        <Heading size="lg">Clothing recommendations</Heading>
        <Text color="fg.muted">
          Add style profiles to get tailored recommendations. Each profile can
          have its own description, price range, brand style, material, and
          sizes.
        </Text>

        <Button
          onClick={handleAddProfile}
          colorPalette="blue"
          className="add-profile-btn"
        >
          Add Style Profile
        </Button>

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
            No style profiles yet. Click &quot;Add Style Profile&quot; to create
            one.
          </Box>
        ) : (
          <>
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
                  onSaveSuccess={() =>
                    setExpandedIds((prev) => prev.filter((id) => id !== profile.id))
                  }
                />
              ))}
            </Accordion.Root>

            {/* Search Section */}
            <Box
              p="6"
              borderRadius="lg"
              borderWidth="1px"
              bg="bg.subtle"
              className="search-section"
            >
              <VStack gap="4" align="stretch">
                <Heading size="md">Search for Items</Heading>
                <Text color="fg.muted" fontSize="sm">
                  Select a profile and search for matching clothing items on eBay
                </Text>

                <Field.Root>
                  <Field.Label>Select Profile</Field.Label>
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
                  <Field.HelperText>
                    The selected profile's preferences will be used for the search
                  </Field.HelperText>
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
                  <Box
                    p="3"
                    borderRadius="md"
                    bg="red.50"
                    color="red.700"
                    fontSize="sm"
                  >
                    {searchError}
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Search Results */}
            {isSearching && (
              <Box textAlign="center" py="8">
                <Spinner size="lg" colorPalette="blue" />
                <Text mt="4" color="fg.muted">
                  Searching for items...
                </Text>
              </Box>
            )}

            {!isSearching && searchResults.length > 0 && (
              <Box>
                <Heading size="md" mb="4">
                  Search Results ({searchResults.length} items)
                </Heading>
                <Grid
                  templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
                  gap="6"
                  className="results-grid"
                >
                  {searchResults.map((item) => (
                    console.log(item),
                    <Box
                      key={item.id}
                      borderRadius="lg"
                      borderWidth="1px"
                      overflow="hidden"
                      bg="bg.surface"
                      transition="all 0.2s"
                      _hover={{
                        transform: "translateY(-4px)",
                        shadow: "lg",
                      }}
                      className="result-item"
                    >
                      {item.item.image_urls[0] && (
                        <Image
                          src={item.item.image_urls[0]}
                          alt={item.item.name}
                          width="100%"
                          height="200px"
                          objectFit="cover"
                        />
                      )}
                      <Box p="4">
                        <Text
                          fontWeight="semibold"
                          fontSize="sm"
                          lineClamp={2}
                          mb="2"
                          minHeight="40px"
                        >
                          {item.item.name}
                        </Text>
                        <Text
                          fontSize="xl"
                          fontWeight="bold"
                          color="green.600"
                          mb="2"
                        >
                          ${item.item.price} {item.currency}
                        </Text>
                        <Box display="flex" gap="2" mb="3" flexWrap="wrap">
                          {item.condition && (
                            <Badge size="sm" colorPalette="blue">
                              {item.condition}
                            </Badge>
                          )}
                          {/* {item.shippingCost !== "N/A" && (
                            <Badge size="sm" colorPalette="gray">
                              +${item.shippingCost} shipping
                            </Badge>
                          )} */}
                        </Box>
                        <Text fontSize="xs" color="fg.muted" mb="3">
                          Seller: {item.item.brand_store} via {item.item.data_source}
                        </Text>
                        <Button
                          asChild
                          size="sm"
                          width="100%"
                          colorPalette="blue"
                        >
                          <a
                            href={item.item.itemWebUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on {item.item.data_source}
                          </a>
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Grid>
              </Box>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
}
