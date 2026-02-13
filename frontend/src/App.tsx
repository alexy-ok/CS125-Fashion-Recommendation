import { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  Accordion,
  Box,
  Button,
  Container,
  Field,
  Heading,
  IconButton,
  Input,
  NativeSelect,
  RadioGroup,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { MdEdit } from "react-icons/md";

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
            <IconButton
              aria-label="Edit profile title"
              size="xs"
              variant="ghost"
              flexShrink={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDraftTitle(profile.title);
                setIsEditingTitle(true);
              }}
              className="edit-title-btn"
            >
              <MdEdit />
            </IconButton>
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

  return (
    <Container maxW="container.md" py="8">
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
        )}
      </VStack>
    </Container>
  );
}
