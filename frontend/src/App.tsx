import { useState } from "react";
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
} from "@chakra-ui/react";

export interface ClothingProfile {
  id: string;
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
  description: "",
  minPrice: "",
  maxPrice: "",
  brandPreference: null,
  material: "",
  shirtSize: "",
  pantsSize: "",
});

function StyleProfileAccordionItem({
  profile,
  index,
  onUpdate,
}: {
  profile: ClothingProfile;
  index: number;
  onUpdate: (id: string, updates: Partial<ClothingProfile>) => void;
}) {
  const title =
    profile.description.trim().slice(0, 40) ||
    `Style profile ${index + 1}`;
  const displayTitle =
    title.length >= 40 ? `${title}…` : title || `Style profile ${index + 1}`;

  return (
    <Accordion.Item value={profile.id} className="style-profile-item">
      <Accordion.ItemTrigger className="style-profile-trigger">
        <Text as="span" fontWeight="medium">
          {displayTitle}
        </Text>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody pt="2" pb="4">
          <VStack gap="4" align="stretch">
            <Field.Root>
              <Field.Label>Description / keywords</Field.Label>
              <Textarea
                placeholder="e.g. affordable casual essentials, minimal basics..."
                value={profile.description}
                onChange={(e) =>
                  onUpdate(profile.id, { description: e.target.value })
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
                    value={profile.minPrice}
                    onChange={(e) =>
                      onUpdate(profile.id, { minPrice: e.target.value })
                    }
                  />
                </Field.Root>
                <Field.Root width="min(140px, 100%)">
                  <Field.Label>Max ($)</Field.Label>
                  <Input
                    type="number"
                    placeholder="Any"
                    min={0}
                    value={profile.maxPrice}
                    onChange={(e) =>
                      onUpdate(profile.id, { maxPrice: e.target.value })
                    }
                  />
                </Field.Root>
              </Box>
            </Box>

            <Field.Root>
              <Field.Label>Brand style (optional)</Field.Label>
              <RadioGroup.Root
                value={profile.brandPreference ?? ""}
                onValueChange={(e) =>
                  onUpdate(profile.id, {
                    brandPreference: e.value
                      ? (e.value as "high-end" | "casual")
                      : null,
                  })
                }
              >
                <Box display="flex" gap="4" flexWrap="wrap">
                  <RadioGroup.Item value="high-end">
                    <RadioGroup.ItemControl />
                    <RadioGroup.ItemText>High end brand</RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value="casual">
                    <RadioGroup.ItemControl />
                    <RadioGroup.ItemText>Casual</RadioGroup.ItemText>
                  </RadioGroup.Item>
                </Box>
              </RadioGroup.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Main material (optional)</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={profile.material}
                  onChange={(e) =>
                    onUpdate(profile.id, { material: e.target.value })
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
                    value={profile.shirtSize}
                    onChange={(e) =>
                      onUpdate(profile.id, { shirtSize: e.target.value })
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
                    value={profile.pantsSize}
                    onChange={(e) =>
                      onUpdate(profile.id, { pantsSize: e.target.value })
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
          </VStack>
        </Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

export default function App() {
  const [profiles, setProfiles] = useState<ClothingProfile[]>([]);

  const handleAddProfile = () => {
    setProfiles((prev) => [...prev, createEmptyProfile()]);
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
            defaultValue={profiles.length > 0 ? [profiles[0].id] : []}
            className="profiles-accordion"
          >
            {profiles.map((profile, index) => (
              <StyleProfileAccordionItem
                key={profile.id}
                profile={profile}
                index={index}
                onUpdate={handleUpdateProfile}
              />
            ))}
          </Accordion.Root>
        )}
      </VStack>
    </Container>
  );
}
